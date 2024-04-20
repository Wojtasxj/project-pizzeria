import {settings, select, templates, classNames} from "./../settings.js";
import CartProduct from "./CartProduct.js";
import { app } from "./../app.js";

class Cart{
    constructor(element) {
      const thisCart = this;
      thisCart.products = []; 
      thisCart.getElements(element);
      thisCart.initActions();
    }
    getElements(element) {
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    }
    
    initActions() {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function(){
        thisCart.update();
      });
      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });
    }
    add(menuProduct) {
      const thisCart = this;
      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = document.createRange().createContextualFragment(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      console.log('adding product', menuProduct);
    }
  
    update() {
      const thisCart = this;
      let totalNumber = 0;
      let subtotalPrice = 0;
    
      for (const product of thisCart.products) {
        totalNumber += product.amount;
        subtotalPrice += product.priceSingle * product.amount;
      }
    
      let totalPrice = subtotalPrice + thisCart.deliveryFee;
    
      if (totalNumber === 0) {
        totalPrice = 0;
        thisCart.deliveryFee = 0;
      }
    
      thisCart.dom.totalNumber.innerHTML = totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
      thisCart.dom.totalPrice.innerHTML = totalPrice;
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
    
      console.log('totalNumber:', totalNumber);
      console.log('subtotalPrice:', subtotalPrice);
      console.log('totalPrice:', totalPrice);
    }
    
    sendOrder() {
      const thisCart = this;
      const url = settings.db.url + '/' + settings.db.orders;
      const payload = {};
        payload.address = app.cart.dom.address.value;
        payload.phone = app.cart.dom.phone.value;
        payload.totalNumber = 0;
        for (const product of app.cart.products) {
          payload.totalNumber += product.amount;
        }
        payload.subtotalPrice = parseFloat(app.cart.dom.subtotalPrice.innerHTML);
        payload.deliveryFee = parseFloat(app.cart.dom.deliveryFee.innerHTML);
        payload.totalPrice = payload.subtotalPrice + payload.deliveryFee;
        for(let prod of thisCart.products) {
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
export default Cart;  