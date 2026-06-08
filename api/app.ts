/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import { setCurrentUser } from './src/middleware/currentUser.js'
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js'
import userRoutes from './src/routes/userRoutes.js'
import courseRoutes from './src/routes/courseRoutes.js'
import lessonRoutes from './src/routes/lessonRoutes.js'
import certificateRoutes from './src/routes/certificateRoutes.js'
import discussionRoutes from './src/routes/discussionRoutes.js'
import dashboardRoutes from './src/routes/dashboardRoutes.js'
import { initDatabase } from './src/seeders/seeder.js'

let dbInitialized = false

async function initializeDatabase() {
  if (!dbInitialized) {
    await initDatabase()
    dbInitialized = true
  }
}

initializeDatabase().catch(console.error)

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(setCurrentUser)

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/discussion', discussionRoutes)
app.use('/api/instructor/dashboard', dashboardRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * 404 handler
 */
app.use(notFoundHandler)

/**
 * error handler middleware
 */
app.use(errorHandler)

export default app
