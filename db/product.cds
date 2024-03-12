namespace demo.product;

using {
    cuid,
    managed,
    Currency,
    Country
} from '@sap/cds/common';

entity Product {
    key product_id          : Integer @title: '요청번호';
        product_name        : String @Title: '물품이름';
        product_price       : Integer @title: '물품가격';
        product_image       : String @title: '물품사진';
        product_information : String @title: '물품설명';
        product_date        : String @title: '물품등록일';
        product_state       : String @title: '물품상태';
};

entity Product_State {
    key product_state_key : String @title: '물품상태 키워드';
        product_state_kor : String @title: '물품상태 한국어';
};
