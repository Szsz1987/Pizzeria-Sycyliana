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
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',				// li i span w Subtotal		
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',			 // li i span w Delivery			
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
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
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
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
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
        console.log('thisWidget.input.value', thisWidget.input.value)
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
      const event = new CustomEvent('updated', {
        bubbles: true
      });
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
    }

    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subTotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.formAdress = thisCart.dom.wrapper.querySelector(select.cart.address);
      thisCart.dom.formPhone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    }

    initActions(){
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function(event){
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });

    }

    update(){
      const thisCart = this;
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.subTotalPrice = 0;
      thisCart.totalNumber = 0;
      for(let product of thisCart.products){
        thisCart.totalNumber += product.amount;
        thisCart.subTotalPrice += product.price;
      }
      if(thisCart.totalNumber > 0){
        thisCart.totalPrice = thisCart.subTotalPrice + thisCart.deliveryFee;
        
      }
      else {
        thisCart.totalPrice = 0;
      }
      thisCart.dom.subTotalPrice.innerHTML = thisCart.subTotalPrice;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
      thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
      thisCart.product.amount = product.amount;
    }

    add(menuProduct){
      const thisCart = this;
      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      thisCart.update();
    }

    remove(cartProduct){
      const thisCart = this;
      const index = thisCart.products.indexOf(cartProduct);
      thisCart.products.splice(index, 1);
      cartProduct.dom.wrapper.remove();
      thisCart.update();
    }

    sendOrder(){
      const thisCart = this;
      const url = settings.db.url + '/' + settings.db.orders;
      const payload = {
        address: thisCart.dom.formAdress.value,
        phone: thisCart.dom.formPhone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subtotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: []
      };
      console.log('payload', payload);
      for(let prod of thisCart.products){
        payload.products.push(prod.getData());
      }
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      fetch(url, options);
    }
  }

  class CartProduct {
    constructor(menuProduct, element){
      const thisCartProduct = this;
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
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

    getData(){
      const thisCartProduct = this;
      console.log('thisCartProduct', thisCartProduct);
      const formProduct = {
        id: thisCartProduct.id,
        amount: thisCartProduct.amount,
        price: thisCartProduct.price,
        priceSingle: thisCartProduct.priceSingle,
        name: thisCartProduct.name,
        params: thisCartProduct.params,
      };
      console.log('formProduct', formProduct);
      return formProduct;
    }

    remove(){
      const thisCartProduct = this;
      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    initActions(){
      const thisCartProduct = this;
      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
  }

  const app = {

    initData: function(){
      const thisApp = this;
      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products; // http://localhost:3131/products
      fetch(url)					
        .then(function(rawResponse){					
          return rawResponse.json();					
        })					
        .then(function(parsedResponse){					
          console.log('parsedResponse 3', parsedResponse);					
             
          /* save parsedResponse as thisApp.data.procuts */					
          thisApp.data.products = parsedResponse;

          /* execute initMenu method */
          thisApp.initMenu();					
        });					
             
      console.log('thisApp.data 2', JSON.stringify(thisApp.data));					
    },

    initMenu: function(){
      const thisApp = this;
      console.log('initMenu 4 ', thisApp.data);
      for(let productData in thisApp.data.products){
        new Product (thisApp.data.products[productData].id, thisApp.data.products[productData]);
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
      thisApp.initCart();
    },
  };

  app.init();
}
