import numpy as np

def asymmetric_loss(y_true, y_pred):
    residual = y_pred - y_true
    grad = residual.copy()
    hess = np.ones_like(residual)
    mask_hr_under = (y_true >= -6.5) & (residual < 0)
    grad[mask_hr_under] = residual[mask_hr_under] * 20.0
    hess[mask_hr_under] = 20.0
    mask_border_under = (y_true >= -8.0) & (y_true < -6.5) & (residual < 0)
    grad[mask_border_under] = residual[mask_border_under] * 6.0
    hess[mask_border_under] = 6.0
    return grad, hess

def asymmetric_loss_opt(y_true, y_pred):
    residual = y_pred - y_true
    grad = residual.copy()
    hess = np.ones_like(residual)
    mask_hr = (y_true >= -6.5) & (residual < 0)
    grad[mask_hr] = residual[mask_hr] * 25.0
    hess[mask_hr] = 25.0
    mask_border = (y_true >= -8.0) & (y_true < -6.5) & (residual < 0)
    grad[mask_border] = residual[mask_border] * 8.0
    hess[mask_border] = 8.0
    return grad, hess

def kelvins_direct_loss(y_true, y_pred):
    residual = y_pred - y_true
    grad = residual.copy()
    hess = np.ones_like(residual)
    mask_hr_under = (y_true >= -6.0) & (residual < 0)
    grad[mask_hr_under] = residual[mask_hr_under] * 12.0
    hess[mask_hr_under] = 12.0
    mask_hr_over = (y_true >= -6.0) & (residual >= 0)
    grad[mask_hr_over] = residual[mask_hr_over] * 3.0
    hess[mask_hr_over] = 3.0
    mask_border = (y_true >= -8.0) & (y_true < -6.0) & (residual < 0)
    grad[mask_border] = residual[mask_border] * 4.0
    hess[mask_border] = 4.0
    return grad, hess



