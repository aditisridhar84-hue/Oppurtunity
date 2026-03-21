// controllers/analyticsController.js
const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');
const User = require('../models/User');

// @desc    Get full analytics data for charts
// @route   GET /api/analytics
// @access  Admin
const getAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalApplications,
      totalOpportunities,
      appsByStatus,
      appsByBranch,
      matchDistribution,
      appsByType,
      appsByDay
    ] = await Promise.all([

      User.countDocuments(),

      Application.countDocuments(),

      Opportunity.countDocuments({ isActive: true }),

      // Applications grouped by status
      Application.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Applications by user branch
      Application.aggregate([
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $group: { _id: '$user.branch', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Match score distribution (bucket by range)
      Application.aggregate([
        {
          $bucket: {
            groupBy: '$matchScore',
            boundaries: [0, 40, 60, 75, 90, 101],
            default: 'Other',
            output: { count: { $sum: 1 } }
          }
        }
      ]),

      // Applications by opportunity type
      Application.aggregate([
        { $lookup: { from: 'opportunities', localField: 'opportunityId', foreignField: '_id', as: 'opp' } },
        { $unwind: '$opp' },
        { $group: { _id: '$opp.type', count: { $sum: 1 } } }
      ]),

      // Applications over last 7 days
      Application.aggregate([
        {
          $match: {
            appliedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Calculate success rate
    const accepted = appsByStatus.find(s => s._id === 'accepted');
    const successRate = totalApplications > 0
      ? Math.round(((accepted?.count || 0) / totalApplications) * 100)
      : 0;

    // Format match distribution for Chart.js
    const matchLabels = ['Below 40%', '40-60%', '60-75%', '75-90%', '90-100%'];
    const matchData = [0, 0, 0, 0, 0];
    matchDistribution.forEach(bucket => {
      const idx = [0, 40, 60, 75, 90].indexOf(bucket._id);
      if (idx !== -1) matchData[idx] = bucket.count;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalApplications,
          totalOpportunities,
          successRate
        },
        charts: {
          // For pie/doughnut chart
          applicationsByStatus: {
            labels: appsByStatus.map(s => s._id),
            data: appsByStatus.map(s => s.count)
          },
          // For bar chart
          applicationsByBranch: {
            labels: appsByBranch.map(b => b._id),
            data: appsByBranch.map(b => b.count)
          },
          // For bar chart
          matchDistribution: {
            labels: matchLabels,
            data: matchData
          },
          // For pie chart
          applicationsByType: {
            labels: appsByType.map(t => t._id),
            data: appsByType.map(t => t.count)
          },
          // For line chart
          applicationsOverTime: {
            labels: appsByDay.map(d => d._id),
            data: appsByDay.map(d => d.count)
          }
        }
      }
    });

  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get personal analytics for logged-in user
// @route   GET /api/analytics/me
// @access  Private
const getMyAnalytics = async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.user._id });

    const statusCounts = { applied: 0, pending: 0, accepted: 0, rejected: 0 };
    let totalMatch = 0;

    apps.forEach(a => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      totalMatch += a.matchScore || 0;
    });

    const avgMatch = apps.length > 0 ? Math.round(totalMatch / apps.length) : 0;

    res.json({
      success: true,
      data: {
        totalApplications: apps.length,
        statusBreakdown: statusCounts,
        avgMatchScore: avgMatch,
        successRate: apps.length > 0
          ? Math.round((statusCounts.accepted / apps.length) * 100)
          : 0
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAnalytics, getMyAnalytics };
