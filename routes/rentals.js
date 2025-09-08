const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

const calculatePrice = async (app, carModelId, userId, issueDate, returnDate) => {
  const { CarModel, Customer, Rental } = app.get('models');

  const customer = await Customer.findOne({ user: userId });
  if (!customer) {
    throw new Error('Customer profile not found for this user.');
  }

  const carModelObject = await CarModel.findById(carModelId);
  if (!carModelObject) {
    throw new Error('Car model not found.');
  }

  const oneDay = 24 * 60 * 60 * 1000;
  const startDate = new Date(issueDate);
  const endDate = new Date(returnDate);
  const durationDays = Math.round(Math.abs((endDate - startDate) / oneDay));

  const getDailyRate = (carType, durationDays) => {
    let dailyRate = 0;
    switch (carType) {
      case 'Economy':
        if (durationDays >= 1 && durationDays <= 3) dailyRate = 40; else if (durationDays >= 4 && durationDays <= 9) dailyRate = 30; else if (durationDays >= 10 && durationDays <= 29) dailyRate = 25; else dailyRate = 22;
        break;
      case 'Comfort':
        if (durationDays >= 1 && durationDays <= 3) dailyRate = 50; else if (durationDays >= 4 && durationDays <= 9) dailyRate = 40; else if (durationDays >= 10 && durationDays <= 29) dailyRate = 34; else dailyRate = 29;
        break;
      case 'Business':
        if (durationDays >= 1 && durationDays <= 3) dailyRate = 60; else if (durationDays >= 4 && durationDays <= 9) dailyRate = 50; else if (durationDays >= 10 && durationDays <= 29) dailyRate = 45; else dailyRate = 22;
        break;
      case 'Crossover':
        if (durationDays >= 1 && durationDays <= 3) dailyRate = 70; else if (durationDays >= 4 && durationDays <= 9) dailyRate = 60; else if (durationDays >= 10 && durationDays <= 29) dailyRate = 55; else dailyRate = 52;
        break;
    }
    return dailyRate;
  };

  const dailyRate = getDailyRate(carModelObject.type, durationDays);
  let priceWithoutDiscount = durationDays * dailyRate;
  
  const carAge = new Date().getFullYear() - carModelObject.year;
  let totalDiscount = 0;
  const discountDetails = [];

  if (carAge > 5) {
    const carAgeDiscount = 10;
    totalDiscount += carAgeDiscount;
    discountDetails.push({
      description: 'Discount for car age (over 5 years)',
      percentage: carAgeDiscount
    });
  }

  const customerRentals = await Rental.find({ customer: customer.id });
  if (customerRentals.length >= 3) {
    const loyalCustomerDiscount = 10;
    totalDiscount += loyalCustomerDiscount;
    discountDetails.push({
      description: 'Loyal customer discount (3+ rentals)',
      percentage: loyalCustomerDiscount
    });
  }
  
  let calculatedCost = priceWithoutDiscount;
  if(totalDiscount > 0) {
    calculatedCost = priceWithoutDiscount * (1 - totalDiscount / 100);
  }

  const finalCost = calculatedCost + carModelObject.rentalPrice;
  const deposit = carModelObject.rentalPrice;

  return {
    numberOfDays: durationDays,
    priceBeforeDiscounts: priceWithoutDiscount,
    discountApplied: totalDiscount,
    finalCost,
    deposit,
    calculatedCost,
    carModelObject,
    customer,
    discountDetails,
  };
}

router.get('/all', [auth, authorize(['admin'])], async (req, res) => {
  const { Rental } = req.app.get('models');
  try {
    const rentals = await Rental.find({})
      .populate('carModel')
      .populate({
        path: 'customer',
        select: 'firstName lastName'
      })
      .sort({ issueDate: -1 });
      
    res.json(rentals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/', auth, async (req, res) => {
  const { Rental, Customer } = req.app.get('models');
  try {
    const customer = await Customer.findOne({ user: req.user.id });
    if (!customer) {
      return res.status(404).json({ msg: 'Customer profile not found for this user.' });
    }

    const rentals = await Rental.find({ customer: customer.id })
      .populate('carModel')
      .populate({
        path: 'customer',
        select: 'firstName lastName'
      })
      .sort({ issueDate: -1 });
      
    res.json(rentals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post(
  '/calculate-price',
  [
    auth,
    [
      check('carModel', 'Car Model ID is required').not().isEmpty(),
      check('issueDate', 'Issue date is required').isISO8601().toDate(),
      check('returnDate', 'Return date is required').isISO8601().toDate(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { carModel: carModelId, issueDate, returnDate } = req.body;
    const userId = req.user.id;

    if (new Date(returnDate) <= new Date(issueDate)) {
      return res.status(400).json({ msg: 'Return date must be after issue date.' });
    }

    try {
      const priceDetails = await calculatePrice(req.app, carModelId, userId, issueDate, returnDate);
      res.json(priceDetails);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

router.post(
  '/',
  [
    auth,
    [
      check('carModel', 'Car Model ID is required').not().isEmpty(),
      check('issueDate', 'Issue date is required').isISO8601().toDate(),
      check('returnDate', 'Return date is required').isISO8601().toDate(),
    ],
  ],
  async (req, res) => {
    const { Rental } = req.app.get('models');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { carModel: carModelId, issueDate, returnDate } = req.body;
    const userId = req.user.id;

    if (new Date(returnDate) <= new Date(issueDate)) {
      return res.status(400).json({ msg: 'Return date must be after issue date.' });
    }

    try {
      const {
        finalCost,
        deposit,
        calculatedCost,
        carModelObject,
        customer,
      } = await calculatePrice(req.app, carModelId, userId, issueDate, returnDate);

      const newRental = new Rental({
        carModel: carModelObject._id,
        customer: customer.id,
        issueDate,
        returnDate,
        calculatedCost,
        finalCost,
        deposit,
      });

      const rental = await newRental.save();

      const populatedRental = await Rental.findById(rental._id)
        .populate('carModel')
        .populate({
          path: 'customer',
          select: 'firstName lastName'
        });

      res.json(populatedRental);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

router.get('/:id', auth, async (req, res) => {
  const { Rental, Customer } = req.app.get('models');
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('carModel')
      .populate({
        path: 'customer',
        select: 'firstName lastName'
      });

    if (!rental) {
      return res.status(404).json({ msg: 'Rental not found' });
    }
    
    const customer = await Customer.findById(rental.customer.id);
    if (customer.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(rental);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/:id/return', [auth, authorize(['admin'])], async (req, res) => {
    const { Rental } = req.app.get('models');
    try {
        const rental = await Rental.findById(req.params.id);
        if (!rental) {
            return res.status(404).json({ msg: 'Rental not found' });
        }

        rental.status = 'completed';
        await rental.save();

        const populatedRental = await Rental.findById(rental._id)
            .populate('carModel')
            .populate({ path: 'customer', select: 'firstName lastName' });

        res.json(populatedRental);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/:id/penalty', [auth, authorize(['admin'])], async (req, res) => {
    const { Rental } = req.app.get('models');
    const { penalty } = req.body;

    if (!penalty || isNaN(parseFloat(penalty)) || parseFloat(penalty) <= 0) {
        return res.status(400).json({ msg: 'Valid penalty amount is required.' });
    }

    try {
        const rental = await Rental.findById(req.params.id);
        if (!rental) {
            return res.status(404).json({ msg: 'Rental not found' });
        }

        rental.penalty = (rental.penalty || 0) + parseFloat(penalty);
        rental.finalCost = (rental.finalCost || 0) + parseFloat(penalty);
        await rental.save();

        const populatedRental = await Rental.findById(rental._id)
            .populate('carModel')
            .populate({ path: 'customer', select: 'firstName lastName' });

        res.json(populatedRental);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;