import authRoutes from './auth/authRouter.js'
import appointmentsRoutes from './appointments/appointmentsRouter.js'
import diagnosisRoutes from './diagnosis/diagnosisRouter.js'
import labTestsRoutes from './labTests/labTestsRoutes.js'
import drugsRoutes from './drugs/drugsRouter.js'
import doctorsRoutes from './doctors/doctorsRouter.js'
import notificationsRoutes from './notifications/notificationsRouter.js'
import patientsRoutes from './patients/patientsRouter.js'
//import prescriptionsRoutes from './prescriptions/prescriptionsRouter.js'
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
    //{path: '/prescriptions', route: prescriptionsRoutes}
]