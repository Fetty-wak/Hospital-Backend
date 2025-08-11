import authRoutes from './auth/authRouter.js'
//import appointmentsRoutes from './appointments/appointmentsRouter.js'
//import diagnosisRoutes from './diagnosis/diagnosisRouter.js'
//import doctorsRoutes from './doctors/doctorsRouter.js'
//import notificationsRoutes from './notifications/notificationsRouter.js'
//import patientsRoutes from './patients/patientsRouter.js'
//import prescriptionsRoutes from './prescriptions/prescriptionsRouter.js'

export default [
    {path: '/auth', route: authRoutes}
    //{path: '/appointment', route: appointmentsRoutes},
    //{path: '/diagnosis', route: diagnosisRoutes},
    //{path: '/doctors', route: doctorsRoutes},
    //{path: '/notification', route: notificationsRoutes},
    //{path: '/patients', route: patientsRoutes},
    //{path: '/prescription', route: prescriptionsRoutes}
]