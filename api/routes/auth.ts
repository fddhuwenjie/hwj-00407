/**
 * User authentication API routes
 * Handle user registration, login, logout, and JWT token management
 */
import { Router, type Request, type Response } from 'express'
import { body, validationResult } from 'express-validator'
import { User } from '../src/models/index.js'
import { hashPassword, comparePassword } from '../src/utils/password.js'
import { generateToken } from '../src/utils/jwt.js'
import { AppError } from '../src/middleware/errorHandler.js'
import { requireAuth } from '../src/middleware/currentUser.js'
import { asyncHandler } from '../src/middleware/asyncHandler.js'

const router = Router()

/**
 * User Registration
 * POST /api/auth/register
 */
router.post(
  '/register',
  [
    body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['student', 'instructor']).withMessage('Role must be student or instructor'),
  ],
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      })
      return
    }

    const { name, email, password, role = 'student' } = req.body

    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      throw new AppError('Email already registered', 409)
    }

    const passwordHash = await hashPassword(password)

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const userResponse = user.toJSON()
    delete (userResponse as { passwordHash?: string }).passwordHash

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
    })
  })
)

/**
 * User Login
 * POST /api/auth/login
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      })
      return
    }

    const { email, password } = req.body

    const user = await User.findOne({ where: { email } })
    if (!user) {
      throw new AppError('Invalid email or password', 401)
    }

    if (!user.passwordHash) {
      throw new AppError('Please set a password first', 400)
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash)
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401)
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const userResponse = user.toJSON()
    delete (userResponse as { passwordHash?: string }).passwordHash

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
    })
  })
)

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
}))

/**
 * Get Current User
 * GET /api/auth/me
 */
router.get('/me', requireAuth, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userResponse = req.currentUser!.toJSON()
  delete (userResponse as { passwordHash?: string }).passwordHash

  res.status(200).json({
    success: true,
    data: {
      user: userResponse,
    },
  })
}))

export default router
