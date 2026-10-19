export * from '../models/AuthToken';
export * from '../models/Cart';
export * from '../models/CartItem';
export * from '../models/CartItemInput';
export * from '../models/Category';
export * from '../models/GetHealth200Response';
export * from '../models/InlineObject';
export * from '../models/ListCategories200Response';
export * from '../models/ListProducts200Response';
export * from '../models/ListPromoCodes200Response';
export * from '../models/ListSellerOrderItems200Response';
export * from '../models/ListShippingMethods200Response';
export * from '../models/ListUsers200Response';
export * from '../models/LoginInput';
export * from '../models/MergeCartRequest';
export * from '../models/ModelError';
export * from '../models/Order';
export * from '../models/OrderInput';
export * from '../models/OrderItem';
export * from '../models/OrderList';
export * from '../models/OrderStatus';
export * from '../models/PaginationMeta';
export * from '../models/Product';
export * from '../models/ProductImage';
export * from '../models/ProductInput';
export * from '../models/ProductList';
export * from '../models/PromoCode';
export * from '../models/PromoCodeInput';
export * from '../models/PromoValidation';
export * from '../models/RegisterInput';
export * from '../models/RejectProductRequest';
export * from '../models/SellerBrief';
export * from '../models/SellerOrderItem';
export * from '../models/ShippingAddress';
export * from '../models/ShippingMethod';
export * from '../models/UpdateCartItemRequest';
export * from '../models/UpdateOrderStatusRequest';
export * from '../models/UpdateUserRoleRequest';
export * from '../models/User';
export * from '../models/UserRole';
export * from '../models/ValidatePromoRequest';

import { AuthToken } from '../models/AuthToken';
import { Cart } from '../models/Cart';
import { CartItem } from '../models/CartItem';
import { CartItemInput } from '../models/CartItemInput';
import { Category } from '../models/Category';
import { GetHealth200Response, GetHealth200ResponseStatusEnum     } from '../models/GetHealth200Response';
import { InlineObject , InlineObjectErrorEnum     } from '../models/InlineObject';
import { ListCategories200Response } from '../models/ListCategories200Response';
import { ListProducts200Response } from '../models/ListProducts200Response';
import { ListPromoCodes200Response } from '../models/ListPromoCodes200Response';
import { ListSellerOrderItems200Response } from '../models/ListSellerOrderItems200Response';
import { ListShippingMethods200Response } from '../models/ListShippingMethods200Response';
import { ListUsers200Response } from '../models/ListUsers200Response';
import { LoginInput } from '../models/LoginInput';
import { MergeCartRequest } from '../models/MergeCartRequest';
import { ModelError , ModelErrorErrorEnum     } from '../models/ModelError';
import { Order              } from '../models/Order';
import { OrderInput } from '../models/OrderInput';
import { OrderItem } from '../models/OrderItem';
import { OrderList } from '../models/OrderList';
import { OrderStatus } from '../models/OrderStatus';
import { PaginationMeta } from '../models/PaginationMeta';
import { Product      , ProductStatusEnum          } from '../models/Product';
import { ProductImage } from '../models/ProductImage';
import { ProductInput } from '../models/ProductInput';
import { ProductList } from '../models/ProductList';
import { PromoCode  , PromoCodeTypeEnum         } from '../models/PromoCode';
import { PromoCodeInput , PromoCodeInputTypeEnum       } from '../models/PromoCodeInput';
import { PromoValidation } from '../models/PromoValidation';
import { RegisterInput } from '../models/RegisterInput';
import { RejectProductRequest } from '../models/RejectProductRequest';
import { SellerBrief } from '../models/SellerBrief';
import { SellerOrderItem         } from '../models/SellerOrderItem';
import { ShippingAddress } from '../models/ShippingAddress';
import { ShippingMethod } from '../models/ShippingMethod';
import { UpdateCartItemRequest } from '../models/UpdateCartItemRequest';
import { UpdateOrderStatusRequest  } from '../models/UpdateOrderStatusRequest';
import { UpdateUserRoleRequest  } from '../models/UpdateUserRoleRequest';
import { User        } from '../models/User';
import { UserRole } from '../models/UserRole';
import { ValidatePromoRequest } from '../models/ValidatePromoRequest';

/* tslint:disable:no-unused-variable */
let primitives = [
                    "string",
                    "boolean",
                    "double",
                    "integer",
                    "long",
                    "float",
                    "number",
                    "any"
                 ];

let enumsMap: Set<string> = new Set<string>([
    "GetHealth200ResponseStatusEnum",
    "InlineObjectErrorEnum",
    "ModelErrorErrorEnum",
    "OrderStatus",
    "ProductStatusEnum",
    "PromoCodeTypeEnum",
    "PromoCodeInputTypeEnum",
    "UserRole",
]);

let typeMap: {[index: string]: any} = {
    "AuthToken": AuthToken,
    "Cart": Cart,
    "CartItem": CartItem,
    "CartItemInput": CartItemInput,
    "Category": Category,
    "GetHealth200Response": GetHealth200Response,
    "InlineObject": InlineObject,
    "ListCategories200Response": ListCategories200Response,
    "ListProducts200Response": ListProducts200Response,
    "ListPromoCodes200Response": ListPromoCodes200Response,
    "ListSellerOrderItems200Response": ListSellerOrderItems200Response,
    "ListShippingMethods200Response": ListShippingMethods200Response,
    "ListUsers200Response": ListUsers200Response,
    "LoginInput": LoginInput,
    "MergeCartRequest": MergeCartRequest,
    "ModelError": ModelError,
    "Order": Order,
    "OrderInput": OrderInput,
    "OrderItem": OrderItem,
    "OrderList": OrderList,
    "PaginationMeta": PaginationMeta,
    "Product": Product,
    "ProductImage": ProductImage,
    "ProductInput": ProductInput,
    "ProductList": ProductList,
    "PromoCode": PromoCode,
    "PromoCodeInput": PromoCodeInput,
    "PromoValidation": PromoValidation,
    "RegisterInput": RegisterInput,
    "RejectProductRequest": RejectProductRequest,
    "SellerBrief": SellerBrief,
    "SellerOrderItem": SellerOrderItem,
    "ShippingAddress": ShippingAddress,
    "ShippingMethod": ShippingMethod,
    "UpdateCartItemRequest": UpdateCartItemRequest,
    "UpdateOrderStatusRequest": UpdateOrderStatusRequest,
    "UpdateUserRoleRequest": UpdateUserRoleRequest,
    "User": User,
    "ValidatePromoRequest": ValidatePromoRequest,
}

type MimeTypeDescriptor = {
    type: string;
    subtype: string;
    subtypeTokens: string[];
};

/**
 * Every mime-type consists of a type, subtype, and optional parameters.
 * The subtype can be composite, including information about the content format.
 * For example: `application/json-patch+json`, `application/merge-patch+json`.
 *
 * This helper transforms a string mime-type into an internal representation.
 * This simplifies the implementation of predicates that in turn define common rules for parsing or stringifying
 * the payload.
 */
const parseMimeType = (mimeType: string): MimeTypeDescriptor => {
    const [type = '', subtype = ''] = mimeType.split('/');
    return {
        type,
        subtype,
        subtypeTokens: subtype.split('+'),
    };
};

type MimeTypePredicate = (mimeType: string) => boolean;

// This factory creates a predicate function that checks a string mime-type against defined rules.
const mimeTypePredicateFactory = (predicate: (descriptor: MimeTypeDescriptor) => boolean): MimeTypePredicate => (mimeType) => predicate(parseMimeType(mimeType));

// Use this factory when you need to define a simple predicate based only on type and, if applicable, subtype.
const mimeTypeSimplePredicateFactory = (type: string, subtype?: string): MimeTypePredicate => mimeTypePredicateFactory((descriptor) => {
    if (descriptor.type !== type) return false;
    if (subtype != null && descriptor.subtype !== subtype) return false;
    return true;
});

// Creating a set of named predicates that will help us determine how to handle different mime-types
const isTextLikeMimeType = mimeTypeSimplePredicateFactory('text');
const isJsonMimeType = mimeTypeSimplePredicateFactory('application', 'json');
const isJsonLikeMimeType = mimeTypePredicateFactory((descriptor) => descriptor.type === 'application' && descriptor.subtypeTokens.some((item) => item === 'json'));
const isOctetStreamMimeType = mimeTypeSimplePredicateFactory('application', 'octet-stream');
const isFormUrlencodedMimeType = mimeTypeSimplePredicateFactory('application', 'x-www-form-urlencoded');

// Defining a list of mime-types in the order of prioritization for handling.
const supportedMimeTypePredicatesWithPriority: MimeTypePredicate[] = [
    isJsonMimeType,
    isJsonLikeMimeType,
    isTextLikeMimeType,
    isOctetStreamMimeType,
    isFormUrlencodedMimeType,
];

const nullableSuffix = " | null";
const optionalSuffix = " | undefined";
const arrayPrefix = "Array<";
const arraySuffix = ">";
const mapPrefix = "{ [key: string]: ";
const mapSuffix = "; }";

export class ObjectSerializer {
    public static findCorrectType(data: any, expectedType: string) {
        if (data == undefined) {
            return expectedType;
        } else if (primitives.indexOf(expectedType.toLowerCase()) !== -1) {
            return expectedType;
        } else if (expectedType === "Date") {
            return expectedType;
        } else {
            if (enumsMap.has(expectedType)) {
                return expectedType;
            }

            if (!typeMap[expectedType]) {
                return expectedType; // w/e we don't know the type
            }

            // Check the discriminator
            let discriminatorProperty = typeMap[expectedType].discriminator;
            if (discriminatorProperty == null) {
                return expectedType; // the type does not have a discriminator. use it.
            } else {
                if (data[discriminatorProperty]) {
                    var discriminatorType = data[discriminatorProperty];
                    let mapping = typeMap[expectedType].mapping;
                    if (mapping != undefined && mapping[discriminatorType]) {
                        return mapping[discriminatorType]; // use the type given in the discriminator
                    } else if(typeMap[discriminatorType]) {
                        return discriminatorType;
                    } else {
                        return expectedType; // discriminator did not map to a type
                    }
                } else {
                    return expectedType; // discriminator was not present (or an empty string)
                }
            }
        }
    }

    public static serialize(data: any, type: string, format: string): any {
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.endsWith(nullableSuffix)) {
            let subType: string = type.slice(0, -nullableSuffix.length); // Type | null => Type
            return ObjectSerializer.serialize(data, subType, format);
        } else if (type.endsWith(optionalSuffix)) {
            let subType: string = type.slice(0, -optionalSuffix.length); // Type | undefined => Type
            return ObjectSerializer.serialize(data, subType, format);
        } else if (type.startsWith(arrayPrefix)) {
            let subType: string = type.slice(arrayPrefix.length, -arraySuffix.length); // Array<Type> => Type
            let transformedData: any[] = [];
            for (let date of data) {
                transformedData.push(ObjectSerializer.serialize(date, subType, format));
            }
            return transformedData;
        } else if (type.startsWith(mapPrefix)) {
            let subType: string = type.slice(mapPrefix.length, -mapSuffix.length); // { [key: string]: Type; } => Type
            let transformedData: { [key: string]: any } = {};
            for (let key in data) {
                transformedData[key] = ObjectSerializer.serialize(
                    data[key],
                    subType,
                    format,
                );
            }
            return transformedData;
        } else if (type === "Date") {
            if (format == "date") {
                let month = data.getMonth()+1
                month = month < 10 ? "0" + month.toString() : month.toString()
                let day = data.getDate();
                day = day < 10 ? "0" + day.toString() : day.toString();

                return data.getFullYear() + "-" + month + "-" + day;
            } else {
                return data.toISOString();
            }
        } else {
            if (enumsMap.has(type)) {
                return data;
            }
            if (!typeMap[type]) { // in case we dont know the type
                return data;
            }

            // Get the actual type of this object
            type = this.findCorrectType(data, type);

            // get the map for the correct type.
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            let instance: {[index: string]: any} = {};
            for (let attributeType of attributeTypes) {
                instance[attributeType.baseName] = ObjectSerializer.serialize(data[attributeType.name], attributeType.type, attributeType.format);
            }
            return instance;
        }
    }

    public static deserialize(data: any, type: string, format: string): any {
        // polymorphism may change the actual type.
        type = ObjectSerializer.findCorrectType(data, type);
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.endsWith(nullableSuffix)) {
            let subType: string = type.slice(0, -nullableSuffix.length); // Type | null => Type
            return ObjectSerializer.deserialize(data, subType, format);
        } else if (type.endsWith(optionalSuffix)) {
            let subType: string = type.slice(0, -optionalSuffix.length); // Type | undefined => Type
            return ObjectSerializer.deserialize(data, subType, format);
        } else if (type.startsWith(arrayPrefix)) {
            let subType: string = type.slice(arrayPrefix.length, -arraySuffix.length); // Array<Type> => Type
            let transformedData: any[] = [];
            for (let date of data) {
                transformedData.push(ObjectSerializer.deserialize(date, subType, format));
            }
            return transformedData;
        } else if (type.startsWith(mapPrefix)) {
            let subType: string = type.slice(mapPrefix.length, -mapSuffix.length); // { [key: string]: Type; } => Type
            let transformedData: { [key: string]: any } = {};
            for (let key in data) {
                transformedData[key] = ObjectSerializer.deserialize(
                    data[key],
                    subType,
                    format,
                );
            }
            return transformedData;
        } else if (type === "Date") {
            return new Date(data);
        } else {
            if (enumsMap.has(type)) {// is Enum
                return data;
            }

            if (!typeMap[type]) { // dont know the type
                return data;
            }
            let instance = new typeMap[type]();
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            for (let attributeType of attributeTypes) {
                let value = ObjectSerializer.deserialize(data[attributeType.baseName], attributeType.type, attributeType.format);
                if (value !== undefined) {
                    instance[attributeType.name] = value;
                }
            }
            return instance;
        }
    }


    /**
     * Normalize media type
     *
     * We currently do not handle any media types attributes, i.e. anything
     * after a semicolon. All content is assumed to be UTF-8 compatible.
     */
    public static normalizeMediaType(mediaType: string | undefined): string | undefined {
        if (mediaType === undefined) {
            return undefined;
        }
        return (mediaType.split(";")[0] ?? '').trim().toLowerCase();
    }

    /**
     * From a list of possible media types, choose the one we can handle best.
     *
     * The order of the given media types does not have any impact on the choice
     * made.
     */
    public static getPreferredMediaType(mediaTypes: Array<string>): string {
        /** According to OAS 3 we should default to json */
        if (mediaTypes.length === 0) {
            return "application/json";
        }

        const normalMediaTypes = mediaTypes.map(ObjectSerializer.normalizeMediaType);

        for (const predicate of supportedMimeTypePredicatesWithPriority) {
            for (const mediaType of normalMediaTypes) {
                if (mediaType != null && predicate(mediaType)) {
                    return mediaType;
                }
            }
        }

        throw new Error("None of the given media types are supported: " + mediaTypes.join(", "));
    }

    /**
     * Convert data to a string according the given media type
     */
    public static stringify(data: any, mediaType: string): string {
        if (isTextLikeMimeType(mediaType)) {
            return String(data);
        }

        if (isJsonLikeMimeType(mediaType)) {
            return JSON.stringify(data);
        }

        throw new Error("The mediaType " + mediaType + " is not supported by ObjectSerializer.stringify.");
    }

    /**
     * Parse data from a string according to the given media type
     */
    public static parse(rawData: string, mediaType: string | undefined) {
        if (mediaType === undefined) {
            throw new Error("Cannot parse content. No Content-Type defined.");
        }

        if (isTextLikeMimeType(mediaType)) {
            return rawData;
        }

        if (isJsonLikeMimeType(mediaType)) {
            return JSON.parse(rawData);
        }

        throw new Error("The mediaType " + mediaType + " is not supported by ObjectSerializer.parse.");
    }
}
