import authRoutes from './auth/authRouter.js'
import appointmentsRoutes from './appointments/appointmentsRouter.js'
import diagnosisRoutes from './diagnosis/diagnosisRouter.js'
import labTestsRoutes from './labTests/labTestsRoutes.js'
import drugsRoutes from './drugs/drugsRouter.js'
import doctorsRoutes from './doctors/doctorsRouter.js'
import notificationsRoutes from './notifications/notificationsRouter.js'
import patientsRoutes from './patients/patientsRouter.js'
import lab_techRoutes from './lab_techs/lab_techsRouter.js'
import pharmacistRoutes from './pharmacists/pharmacistsRouter.js'
import userRoutes from './users/userRoutes.js'
import prescriptionsRoutes from './prescriptions/prescriptionsRouter.js'
import departmentsRoutes from './departments/departmentsRouter.js'

export default [
    {path: '/auth', route: authRoutes},
    {path: '/appointments', route: appointmentsRoutes},
    {path: '/diagnosis', route: diagnosisRoutes},
    {path: '/departments', route: departmentsRoutes},
    {path: '/labTests', route: labTestsRoutes},
    {path: '/drugs', route: drugsRoutes},
    {path: '/doctors', route: doctorsRoutes},
    {path: '/notifications', route: notificationsRoutes},
    {path: '/patients', route: patientsRoutes},
    {path: '/lab_techs', route: lab_techRoutes},
    {path: '/pharmacists', route: pharmacistRoutes},
    {path: '/users', route: userRoutes},
    {path: '/prescriptions', route: prescriptionsRoutes}
]