const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Caregiver = require('../models/Caregiver');
const Appointment = require('../models/Appointment');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    const query = {};
    
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort('-createdAt');

    const total = await User.countDocuments(query);

    return successResponse(res, {
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};

const getUserDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    let profile = null;
    if (user.role === 'patient') {
      profile = await Patient.findOne({ user: userId })
        .populate('primaryDoctor')
        .populate('assignedCaregivers');
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ user: userId });
    } else if (user.role === 'caregiver') {
      profile = await Caregiver.findOne({ user: userId });
    }

    return successResponse(res, { user, profile });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-passwordHash');

    return successResponse(res, user, 'User status updated successfully');
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const allowedRoles = ['patient', 'doctor', 'caregiver', 'admin'];

    if (!allowedRoles.includes(role)) {
      return errorResponse(res, 'Invalid role', 400);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, user, 'User role updated successfully');
  } catch (error) {
    next(error);
  }
};

const getDoctors = async (req, res, next) => {
  try {
    const { verified, page = 1, limit = 20, search } = req.query;
    const query = {};

    if (verified === 'true') query.isVerified = true;
    if (verified === 'false') query.isVerified = false;

    const userMatch = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : null;

    const doctors = await Doctor.find(query)
      .populate({
        path: 'user',
        select: 'name email phoneNumber isActive createdAt',
        ...(userMatch ? { match: userMatch } : {})
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort('-createdAt');

    const total = await Doctor.countDocuments(query);

    return successResponse(res, {
      doctors: search ? doctors.filter((doctor) => doctor.user) : doctors,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    next(error);
  }
};

const verifyDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { verified = true } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { isVerified: Boolean(verified) },
      { new: true }
    ).populate('user', 'name email phoneNumber isActive createdAt');

    if (!doctor) {
      return errorResponse(res, 'Doctor not found', 404);
    }

    return successResponse(res, doctor, 'Doctor verification updated');
  } catch (error) {
    next(error);
  }
};

const verifyCaregiver = async (req, res, next) => {
  try {
    const { caregiverId } = req.params;
    const { status, reportUrl } = req.body;

    const caregiver = await Caregiver.findByIdAndUpdate(
      caregiverId,
      {
        'backgroundCheck.status': status,
        'backgroundCheck.completedDate': new Date(),
        'backgroundCheck.reportUrl': reportUrl,
        isVerified: status === 'cleared'
      },
      { new: true }
    );

    return successResponse(res, caregiver, 'Caregiver verification updated');
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      totalUsers: await User.countDocuments(),
      totalPatients: await Patient.countDocuments(),
      totalDoctors: await Doctor.countDocuments(),
      totalCaregivers: await Caregiver.countDocuments(),
      pendingVerifications: {
        doctors: await Doctor.countDocuments({ isVerified: false }),
        caregivers: await Caregiver.countDocuments({ isVerified: false })
      },
      todayAppointments: await Appointment.countDocuments({
        date: { $gte: today }
      }),
      recentUsers: await User.find()
        .select('-passwordHash')
        .sort('-createdAt')
        .limit(10)
    };

    return successResponse(res, stats);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.role === 'patient') {
      await Patient.deleteOne({ user: userId });
    } else if (user.role === 'doctor') {
      await Doctor.deleteOne({ user: userId });
    } else if (user.role === 'caregiver') {
      await Caregiver.deleteOne({ user: userId });
    }

    await user.deleteOne();

    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  updateUserRole,
  getDoctors,
  verifyDoctor,
  verifyCaregiver,
  getDashboardStats,
  deleteUser
};
