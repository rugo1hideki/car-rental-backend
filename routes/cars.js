const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

router.get('/', async (req, res) => {
  const { CarModel } = req.app.get('models');
  try {
    const { brand, type, year, minPrice, maxPrice, engineType } = req.query;
    const filter = {};

    if (brand) {
      filter.brand = new RegExp(brand, 'i');
    }
    if (type) {
      filter.type = new RegExp(type, 'i');
    }
    if (engineType) {
      filter.engineType = new RegExp(engineType, 'i');
    }
    if (year) {
      filter.year = year;
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = minPrice;
      }
      if (maxPrice) {
        filter.price.$lte = maxPrice;
      }
    }

    const carModels = await CarModel.find(filter).sort({ brand: 1 });
    res.json(carModels);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post(
  '/',
  [auth, authorize(['admin'])],
  [
    check('brand', 'Brand is required').not().isEmpty(),
    check('price', 'Price is required').isNumeric(),
    check('rentalPrice', 'Rental price is required').isNumeric(),
    check('type', 'Type is required').not().isEmpty(),
    check('year', 'Year is required').isNumeric(),
    check('engineType', 'Engine type is required').not().isEmpty(),
  ],
  async (req, res) => {
    const { CarModel } = req.app.get('models');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { brand, price, rentalPrice, type, year, engineType } = req.body;

    try {
      const newCarModel = new CarModel({
        brand,
        price,
        rentalPrice,
        type,
        year,
        engineType,
      });

      const carModel = await newCarModel.save();
      res.json(carModel);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

router.get('/:id', async (req, res) => {
  const { CarModel } = req.app.get('models');
  try {
    const carModel = await CarModel.findById(req.params.id);
    if (!carModel) {
      return res.status(404).json({ msg: 'Car model not found' });
    }
    res.json(carModel);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Car model not found' });
    }
    res.status(500).send('Server Error');
  }
});

router.put('/:id', [auth, authorize(['admin'])], async (req, res) => {
  const { CarModel } = req.app.get('models');
  const { brand, price, rentalPrice, type, year, imageUrl, engineType } = req.body;

  const carModelFields = {};
  if (brand !== undefined) carModelFields.brand = brand;
  if (price !== undefined) carModelFields.price = price;
  if (rentalPrice !== undefined) carModelFields.rentalPrice = rentalPrice;
  if (type !== undefined) carModelFields.type = type;
  if (year !== undefined) carModelFields.year = year;
  if (imageUrl !== undefined) carModelFields.imageUrl = imageUrl;
  if (engineType !== undefined) carModelFields.engineType = engineType;

  try {
    let carModel = await CarModel.findById(req.params.id);

    if (!carModel) return res.status(404).json({ msg: 'Car model not found' });

    carModel = await CarModel.findByIdAndUpdate(
      req.params.id,
      { $set: carModelFields },
      { new: true }
    );

    res.json(carModel);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/:id', [auth, authorize(['admin'])], async (req, res) => {
  const { CarModel } = req.app.get('models');
  try {
    let carModel = await CarModel.findById(req.params.id);

    if (!carModel) return res.status(404).json({ msg: 'Car model not found' });

    await CarModel.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Car model removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;