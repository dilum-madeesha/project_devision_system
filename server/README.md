/*
SETUP INSTRUCTIONS:

1. Create your project directory:
   mkdir project-division-backend
   cd project-division-backend

2. Initialize npm and install dependencies:
   npm init -y
   npm install express cors helmet cookie-parser morgan bcryptjs jsonwebtoken express-rate-limit validator dotenv @prisma/client
   npm install -D nodemon prisma

3. Initialize Prisma:
   npx prisma init

4. Create database in phpMyAdmin:
   - Open phpMyAdmin
   - Create database: "project_division_db"

5. Update .env file with your database URL:
   DATABASE_URL="mysql://root:@localhost:3306/project_division_db"

6. Create all the files with the provided code

7. Generate Prisma client and run migrations:
   npx prisma generate
   npx prisma migrate dev --name init

8. Seed the database:
   npm run db:seed

9. Start the development server:
   npm run dev

Your server will be running on http://localhost:5000

Test endpoints:
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- GET /api/auth/profile - Get user profile (requires token)
- GET /api/health - Health check

Default users created (with privilege level L1–L7):
- admin/Admin123! – SYSTEM_ADMIN (L1)
- viewer/Viewer123! – OPERATION_VIEWER (L2)
- manager/Manager123! – OPERATION_MANAGER (L3)
- regmanager/RegMgr123! – REGISTRATION_MANAGER (L4)
- jobcost/JobCost123! – JOB_COST_MANAGER (L5)
- laborcost/LaborCost123! – LABOR_COST_MANAGER (L6)
- materialcost/MaterialCost123! – MATERIAL_COST_MANAGER (L7)

You can log in with any of the above credentials; the login route does **not** require admin rights.  If only the admin account appears to work, double‑check that the other users were seeded or that you passed the correct username/password and that `isActive` is true.

> **Automatic privilege correction:** the seeder now updates existing user records.  If you previously ran the old seed and some accounts had wrong privilege numbers (e.g. 10, 7, 1), simply re‑run `npm run db:seed` and it will adjust them to the correct L1‑L7 values without deleting any data.

**Token notes:**
- The login response now returns both an access token and a refresh token.  The latter is also stored in an httpOnly cookie by the server.
- Clients will typically keep the refresh token in localStorage as well; if you are seeing repeated `POST /api/auth/refresh-token 401` entries in the server log it means the client either never saved a token or is sending an outdated value.  Clear local storage (`localStorage.clear()`) and log in again to reset.
*/