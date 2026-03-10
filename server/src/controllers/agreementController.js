import AgreementService from '../services/agreementService.js';

class AgreementController {
  // New agreement create කරන්න
  static async register(req, res) {
    try {
      const agreement = await AgreementService.register(req.body);
      res.status(201).json({ success: true, data: agreement });
    } catch (error) {
      try {
        const validationErrors = JSON.parse(error.message);
        return res.status(400).json({ success: false, errors: validationErrors });
      } catch {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  }

  // Agreement update කරන්න
  static async update(req, res) {
    try {
      const agreement = await AgreementService.update(req.params.id, req.body);
      res.json({ success: true, data: agreement });
    } catch (error) {
      try {
        const validationErrors = JSON.parse(error.message);
        return res.status(400).json({ success: false, errors: validationErrors });
      } catch {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  }

  // සියලු agreements ලැයිස්තුගත කරන්න
  static async getAllAgreements(req, res) {
    try {
      const agreements = await AgreementService.getAllAgreements();
      res.json({ success: true, data: agreements });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ID එක අනුව agreement ලබාගන්න
  static async getAgreementById(req, res) {
    try {
      const agreement = await AgreementService.getAgreementById(req.params.id);
      if (!agreement) {
        return res.status(404).json({ success: false, message: 'Agreement not found' });
      }
      res.json({ success: true, data: agreement });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Agreement delete කරන්න
  static async deleteAgreement(req, res) {
    try {
      await AgreementService.deleteAgreement(req.params.id);
      res.json({ success: true, message: 'Agreement deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default AgreementController;
