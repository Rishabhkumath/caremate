const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    if (req.user.role !== 'admin' && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
};

const isDoctor = (req, res, next) => {
  if (req.user && (req.user.role === 'doctor' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Doctor or admin access required' 
    });
  }
};

const isPatient = (req, res, next) => {
  if (req.user && (req.user.role === 'patient' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Patient or admin access required' 
    });
  }
};

const isCaregiver = (req, res, next) => {
  if (req.user && (req.user.role === 'caregiver' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Caregiver or admin access required' 
    });
  }
};

module.exports = { 
  checkRole, 
  isAdmin, 
  isDoctor, 
  isPatient, 
  isCaregiver 
};
