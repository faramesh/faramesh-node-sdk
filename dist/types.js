"use strict";
/**
 * TypeScript type definitions for Faramesh SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FarameshDeniedError = exports.FarameshBatchError = exports.FarameshServerError = exports.FarameshValidationError = exports.FarameshConnectionError = exports.FarameshTimeoutError = exports.FarameshPolicyError = exports.FarameshNotFoundError = exports.FarameshAuthError = exports.FarameshError = void 0;
class FarameshError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "FarameshError";
        Object.setPrototypeOf(this, FarameshError.prototype);
    }
}
exports.FarameshError = FarameshError;
class FarameshAuthError extends FarameshError {
    constructor(message) {
        super(message, 401);
        this.name = "FarameshAuthError";
        Object.setPrototypeOf(this, FarameshAuthError.prototype);
    }
}
exports.FarameshAuthError = FarameshAuthError;
class FarameshNotFoundError extends FarameshError {
    constructor(message) {
        super(message, 404);
        this.name = "FarameshNotFoundError";
        Object.setPrototypeOf(this, FarameshNotFoundError.prototype);
    }
}
exports.FarameshNotFoundError = FarameshNotFoundError;
class FarameshPolicyError extends FarameshError {
    constructor(message) {
        super(message);
        this.name = "FarameshPolicyError";
        Object.setPrototypeOf(this, FarameshPolicyError.prototype);
    }
}
exports.FarameshPolicyError = FarameshPolicyError;
class FarameshTimeoutError extends FarameshError {
    constructor(message) {
        super(message);
        this.name = "FarameshTimeoutError";
        Object.setPrototypeOf(this, FarameshTimeoutError.prototype);
    }
}
exports.FarameshTimeoutError = FarameshTimeoutError;
class FarameshConnectionError extends FarameshError {
    constructor(message) {
        super(message);
        this.name = "FarameshConnectionError";
        Object.setPrototypeOf(this, FarameshConnectionError.prototype);
    }
}
exports.FarameshConnectionError = FarameshConnectionError;
class FarameshValidationError extends FarameshError {
    constructor(message) {
        super(message, 422);
        this.name = "FarameshValidationError";
        Object.setPrototypeOf(this, FarameshValidationError.prototype);
    }
}
exports.FarameshValidationError = FarameshValidationError;
class FarameshServerError extends FarameshError {
    constructor(message) {
        super(message, 500);
        this.name = "FarameshServerError";
        Object.setPrototypeOf(this, FarameshServerError.prototype);
    }
}
exports.FarameshServerError = FarameshServerError;
class FarameshBatchError extends FarameshError {
    constructor(message, successes, errors) {
        super(message);
        this.successes = successes;
        this.errors = errors;
        this.name = "FarameshBatchError";
        Object.setPrototypeOf(this, FarameshBatchError.prototype);
    }
}
exports.FarameshBatchError = FarameshBatchError;
class FarameshDeniedError extends FarameshError {
    constructor(message) {
        super(message);
        this.name = "FarameshDeniedError";
        Object.setPrototypeOf(this, FarameshDeniedError.prototype);
    }
}
exports.FarameshDeniedError = FarameshDeniedError;
