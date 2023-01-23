/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {						
    templateOf: {						
      menuProduct: '#template-menu-product',						
      cartProduct: '#template-cart-product', // szablon produktu w koszyku
    },						
    containerOf: {						
      menu: '#product-list',						
      cart: '#cart',						
    },						
    all: {						
      menuProducts: '#product-list > .product',						
      menuProductsActive: '#product-list > .product.active',						
      formInputs: 'input, select',						
    },						
    menuProduct: {						
      clickable: '.product__header',						
      form: '.product__order',						
      priceElem: '.product__total-price .price',						
      imageWrapper: '.product__images',						
      amountWidget: '.widget-amount',						
      cartButton: '[href="#add-to-cart"]',						
    },						
    widgets: {						
      amount: {						
        input: 'input.amount', // CODE CHANGED						
        linkDecrease: 'a[href="#less"]',						
        linkIncrease: 'a[href="#more"]',						
      },						
    },						
    // CODE ADDED START						
    cart: {						
      productList: '.cart__order-summary',		// ul	lista produktów w koszyku		
      toggleTrigger: '.cart__summary',		    // div treść: 0 - Total price - $ - 0				
      totalNumber: `.cart__total-number`,			// span treść: 0 (przed Total price)		
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong', // pogrubienia w belce i koszyku
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',				// li i span w Subtotal		
      deliveryFee: '.cart__order-delivery . cart__order-price-sum strong',			 // li i span w Delivery			
      form: '.cart__order',				// form od początku listy produktów w koszyku po przycisk order		
      formSubmit: '.cart__order [type="submit"]', // button w koszyku				
      phone: '[name="phone"]',				// input phone		
      address: '[name="address"]',	  // input address 
    },						
    cartProduct: {						
      amountWidget: '.widget-amount',						
      price: '.cart__product-price',						
      edit: '[href="#edit"]',						
      remove: '[href="#remove"]',						
    },						
    // CODE ADDED END						
  };						
              
  const classNames = {						
    menuProduct: {						
      wrapperActive: 'active',						
      imageVisible: 'active',						
    },						
    // CODE ADDED START						
    cart: {						
      wrapperActive: 'active',						
    },						
    // CODE ADDED END						
  };						
              
  const settings = {						
    amountWidget: {						
      defaultValue: 1,						
      defaultMin: 1,						
      defaultMax: 9,						
    }, // CODE CHANGED						
    // CODE ADDED START						
    cart: {						
      defaultDeliveryFee: 20,						
    },						
    // CODE ADDED END						
  };						
              
  const templates = {						
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),						
    // CODE ADDED START						
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),						
    // CODE ADDED END						
  };					  

  class Product {
    constructor (id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      console.log('new Product 3 ', thisProduct);
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
      thisProduct.prepareCartProductParams();
    }

    initAmountWidget(){
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

      // thisProduct.amountWidgetElem === thisWidget.element  
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();  
      });
    }

    renderInMenu(){
      const thisProduct = this;
      const generatedHTML = templates.menuProduct(thisProduct.data);
      // === AmountWidget/constructor(element)
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      // === AmountWidget/constructor(element)
      const menuContainer = document.querySelector(select.containerOf.menu);
      menuContainer.appendChild(thisProduct.element);
    }

    getElements(){
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }
    
    initAccordion(){
      const thisProduct = this;
      thisProduct.accordionTrigger.addEventListener('click', function(event) {
        event.preventDefault();
        const activeProduct = document.querySelector(select.all.menuProductsActive);
        if(activeProduct != null && activeProduct != thisProduct.element){
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }
    
    initOrderForm(){
      const thisProduct = this;
      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder(){
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      let price = thisProduct.data.price;
      for(let paramId in thisProduct.data.params){
        const param = thisProduct.data.params[paramId];

        for(let optionId in param.options){
          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          if(optionSelected){
            if(!option.default == true){
              price += option.price;
            }
          } else if(option.default == true){
            price -= option.price;
          }
          
          const image = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
          if(image){
            if(optionSelected){
              image.classList.add(classNames.menuProduct.imageVisible);
            } else {
              image.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }

      thisProduct.priceSingle = price;

      //multiply price by amount
      price *= thisProduct.amountWidget.value;
      thisProduct.priceMulti = price;

      //update calculated price in the HTML
      thisProduct.priceElem.innerHTML = price;
    } 

    addToCart(){
      const thisProduct = this;
      app.cart.add(thisProduct.prepareCartProduct()); // w app.cart zapisaliśmy instancję klasy Cart
    }

    prepareCartProduct(){
      const thisProduct = this;
      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price : thisProduct.priceMulti,
        params: thisProduct.prepareCartProductParams()
      };
      return productSummary;
    }

    prepareCartProductParams(){
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};

      // for each category (param) 
      for(let paramId in thisProduct.data.params){
        const param = thisProduct.data.params[paramId];

        // create category (param) in const params eg. params = {ingredients: {name: 'Ingredients', options: {}}
    
        params[paramId] = {
          label: param.label,
          options: {}
        };

        // for each option in this category (param)
        for(let optionId in param.options){
          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          if(optionSelected){
            params[paramId].options[optionId] = option.label;
          } 
        }
      }
      return params;
    }
  }

  class AmountWidget{
    constructor(element){
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
      console.log('AmountWidget 4 ', AmountWidget);
      console.log('AmountWidgetconstructor arguments 5 ', element);
    }

    getElements(element){
      const thisWidget = this;
      thisWidget.element = element; // === thisProduct.amountWidgetElem
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);
      if(thisWidget.value !== newValue && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin-1 && newValue <= settings.amountWidget.defaultMax+1){
        thisWidget.value = newValue;
      }
      thisWidget.input.value = thisWidget.value;
      thisWidget.announce();
    }

    initActions(){
      const thisWidget = this;
      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
    
    announce(){
      const thisWidget = this;
      const event = new Event('updated');
      thisWidget.element.dispatchEvent(event);
      //thisWidget.element === thisProduct.amountWidgetElem
    }
  }

  class Cart{
    constructor(element){
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
      console.log('new Cart 6 ', thisCart);
    }

    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger); //short bar in the header
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    }

    initActions(){
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
    }

    add(menuProduct){
      const thisCart = this;
      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDOM);
      console.log('adding product', menuProduct);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      console.log('thisCart.products', thisCart.products);
    }
  }

  class CartProduct {
    constructor(menuProduct, element){
      const thisCartProduct = this;
      thisCartProduct.id = menuProduct.id,
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.params = menuProduct.params;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      console.log('thisCartProduct', thisCartProduct);
    }

    getElements(element){
      const thisCartProduct = this;
      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initAmountWidget(){
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget); 
      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }
  }

  const app = {

    initData: function(){
      const thisApp = this;
      thisApp.data = dataSource;
    },

    initMenu: function(){
      const thisApp = this;
      console.log('initMenu 2 ', thisApp.data);
      for(let productData in thisApp.data.products){
        new Product (productData, thisApp.data.products[productData]);
      }
    },

    initCart: function(){
      const thisApp = this;
      const cartElement = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElement); // w app.cart zapisujemy instancję klasy Cart
    },

    init: function(){
      const thisApp = this;
      console.log('*** App.init 1 ***');
      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };

  app.init();
}
