import { Router } from "express";
const router= Router();

//controller import
import { createDrug, deleteDrug, getAllDrugs, getDrugById, updateDrug } from "../../controllers/drugs/drugsController.js";

//middleware import
import validator from "../../middleware/formValidator.js";
import { accessChecker } from "../../middleware/universalAccessCheck.js";

//validator import
import { createDrugSchema } from "../../validators/drugs/createDrugs.schema.js";
import { updateDrugSchema } from "../../validators/drugs/updateDrugs.schema.js";

//route definitions
router.post('/', accessChecker(['ADMIN', 'PHARMACIST']), validator(createDrugSchema), createDrug);
router.get('/', accessChecker(['ADMIN', 'PHARMACIST', 'DOCTOR']), getAllDrugs);
router.get('/:id', accessChecker(['ADMIN', 'PHARMACIST', 'DOCTOR']), getDrugById);
router.patch('/:id', accessChecker(['ADMIN', 'PHARMACIST']), validator(updateDrugSchema), updateDrug);
router.delete('/:id', accessChecker(['ADMIN', 'PHARMACIST']), deleteDrug);

export default router;