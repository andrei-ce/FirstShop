const Product = require('../models/product');
const { validationResult } = require('express-validator');
const returnError = require('../services/returnError');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    isAuth: req.session.isAuth,
    errorMessage: null,
    validationErrors: [],
  });
};

exports.postAddProduct = async (req, res, next) => {
  //inputs
  const { title, price, description } = req.body;
  const image = req.file;
  console.log('image::::::::::::::::::::::::::::::::::::::::::::::::::::::::');
  console.log(image);
  console.log('image::::::::::::::::::::::::::::::::::::::::::::::::::::::::');

  try {
    //errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
        path: '/admin/add-product',
        pageTitle: 'Add Product',
        editing: false,
        product: { title, price, description, imageUrl },
        hasError: true,
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array(),
      });
    }

    const product = new Product({
      title,
      price,
      description,
      imageUrl,
      userId: req.user,
    });
    await product.save();
    console.log('Created Product');
    res.redirect('/admin/products');
  } catch (error) {
    // (1)
    // return res.status(500).render('admin/edit-product', {
    //   pageTitle: 'Add Product',
    //   path: '/admin/add-product',
    //   editing: false,
    //   hasError: true,
    //   product: { title, price, description, imageUrl },
    //   errorMessage: 'Database operation failed. Please try again.',
    //   validationErrors: [],
    // });

    // (2)
    // return res.redirect('/500');

    // (3)
    // const error = new Error(error);
    // error.httpStatusCode(500);
    // next(error);
    returnError(error, next);
  }
};

exports.getEditProduct = async (req, res, next) => {
  try {
    const editMode = req.query.edit;
    if (!editMode) {
      return res.redirect('/');
    }
    const prodId = req.params.productId;
    let product = await Product.findById(prodId);
    if (!product) {
      return res.redirect('/');
    }
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      product: product,
      hasError: false,
      isAuth: req.session.isAuth,
      errorMessage: null,
      validationErrors: [],
    });
  } catch (error) {
    returnError(error, next);
  }
};

exports.postEditProduct = async (req, res, next) => {
  try {
    //inputs
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageUrl = req.body.imageUrl;
    const updatedDesc = req.body.description;

    //errors
    const errors = validationResult(req);
    console.log(errors.array());
    if (!errors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
        path: '/admin/add-product',
        pageTitle: 'Edit Product',
        editing: true,
        product: {
          title: updatedTitle,
          price: updatedPrice,
          description: updatedDesc,
          imageUrl: updatedImageUrl,
          _id: prodId,
        },
        hasError: true,
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array(),
      });
    }

    let product = await Product.findById(prodId);
    if (product.userId.toString() !== req.user._id.toString()) {
      return res.redirect('/');
    }

    product.title = updatedTitle;
    product.price = updatedPrice;
    product.description = updatedDesc;
    product.imageUrl = updatedImageUrl;
    await product.save();

    console.log('UPDATED PRODUCT!');
    res.redirect('/admin/products');
  } catch (error) {
    returnError(error, next);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    let products = await Product.find({ userId: req.user._id });
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
      isAuth: req.session.isAuth,
    });
  } catch (error) {
    returnError(error, next);
  }
};

exports.postDeleteProduct = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    await Product.deleteOne({ _id: prodId, userId: req.user.id });
    //TODO: DELETE THIS PRODUCT IN ALL CARTS
    // await User.find({cart.items : $in {blablabla }});
    console.log('DESTROYED PRODUCT');
    res.redirect('/admin/products');
  } catch (error) {
    returnError(error, next);
  }
};
