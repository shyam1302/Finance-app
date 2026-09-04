export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'SyntaxError') {
    return res.status(400).json({ success: false, error: 'Invalid JSON format' });
  }

  // Prevent generic DB errors leaking to frontend as requested by user
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
};
