import { createDatasourceSchema, OpenAPIV3 } from "s-core-client";
import { identification, item, salesman, transaction } from "./models";

export const apiSchema = {
    openapi: "3.1.0",
    info: {
        title: "Image Upload and Identification API",
        version: "1.0.0",
        description: "API for uploading images and creating identification documents",
        summary: "API for image upload and identification document creation"
    },
    "servers": [
        {
            "url": "http://localhost:3000",
            "description": "Development server"
        }
    ],
    "paths": {
        "/auth/login": {
            "post": {
                "summary": "User login",
                "description": "Authenticate user with email and password",
                "tags": ["Authentication"],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "email": {
                                        "type": "string",
                                        "format": "email"
                                    },
                                    "password": {
                                        "type": "string"
                                    }
                                },
                                "required": ["email", "password"]
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Login successful",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": { "type": "boolean" },
                                        "user": {
                                            "type": "object",
                                            "properties": {
                                                "id": { "type": "number" },
                                                "email": { "type": "string" },
                                                "firstName": { "type": "string" },
                                                "lastName": { "type": "string" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Invalid credentials"
                    }
                }
            }
        },
        "/auth/logout": {
            "post": {
                "summary": "User logout",
                "description": "End user session",
                "tags": ["Authentication"],
                "responses": {
                    "200": {
                        "description": "Logout successful",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": { "type": "boolean" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/auth/session": {
            "get": {
                "summary": "Check session",
                "description": "Get current user session status",
                "tags": ["Authentication"],
                "responses": {
                    "200": {
                        "description": "Session info",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "authenticated": { "type": "boolean" },
                                        "user": {
                                            "type": "object",
                                            "properties": {
                                                "id": { "type": "number" },
                                                "email": { "type": "string" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/createIdentification": {
            "post": {
                "summary": "Create identification document",
                "description": "Generate an identification document PDF",
                "tags": [
                    "Identification"
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "userId": {
                                            "type": "string",
                                            "description": "User ID for identification"
                                        },
                                        "name": {
                                            "type": "string",
                                            "description": "Full name"
                                        },
                                        "email": {
                                            "type": "string",
                                            "format": "email",
                                            "description": "Email address"
                                        },
                                        "documentType": {
                                            "type": "string",
                                            "enum": [
                                                "passport",
                                                "id_card",
                                                "license"
                                            ],
                                            "description": "Type of identification document"
                                        }
                                    },
                                    "required": [
                                        "userId",
                                        "name",
                                        "email"
                                    ]
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Identification document created successfully",
                        "content": {
                            "application/pdf": {
                                "schema": {
                                    "type": "string",
                                    "format": "binary"
                                }
                            }
                        }
                    },
                    "400": {
                        "description": "Invalid request parameters"
                    },
                    "500": {
                        "description": "Server error during document generation"
                    }
                }
            }
        }
    },
    "components": {
        "schemas": {
            "Image": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string"
                    },
                    "filename": {
                        "type": "string"
                    },
                    "size": {
                        "type": "number"
                    },
                    "path": {
                        "type": "string"
                    },
                    "uploadedAt": {
                        "type": "string",
                        "format": "date-time"
                    }
                }
            },
            "UploadResponse": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string"
                    },
                    "size": {
                        "type": "number"
                    },
                    "path": {
                        "type": "string"
                    }
                }
            }
        }
    },
    "webhooks": {
    }
} as const satisfies OpenAPIV3.DocumentV3_1;

export const datasourceSchema = createDatasourceSchema("test", {
    salesman,
    identification,
    item,
    transaction
});