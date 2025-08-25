export const accessChecker = (roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user role found',
      });
    }

    if (Array.isArray(roles)) {
      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied!',
        });
      }
    } else {
      if (userRole !== roles) {
        return res.status(403).json({
          success: false,
          message: 'Access denied!',
        });
      }
    }

    return next();
  };
};
