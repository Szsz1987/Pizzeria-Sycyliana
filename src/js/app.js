import { settings, select } from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';

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

export default app;