using demo.product from '../db/product';

service ProductService {
    entity Product       as projection on product.Product;
    entity Product_State as projection on product.Product_State;
}
