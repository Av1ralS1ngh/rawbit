FUNCTION_SPECS = {
    # Single val, no upstream => use node.data["value"] or 0
    "identity": {
        "paramExtraction": "single_val",
        "params": {
            "val": {"type": "any", "required": False}
        }
    },

    # Multi val => "concat_all"
    "concat_all": {
        "paramExtraction": "multi_val",
        "params": {
            "vals": {"type": "any", "required": True}
        }
    },

    # No params => "random_256" => paramExtraction: "none"
    "random_256": {
        "paramExtraction": "none",
        "params": {}
    },

   
   
    "public_key_from_private_key": {
        "paramExtraction": "single_val",
        "params": {
            "val": {"type": "string", "required": True}
        }
    },


   
     "uint32_to_little_endian_4_bytes": {
        "paramExtraction": "single_val",
        "params": {
            "val": {"type": "integer", "required": True}
        }
    },
    "encode_varint": {
        "paramExtraction": "single_val",
        "params": {
            "val": {"type": "integer", "required": False}
        }
    },
     "reverse_txid_bytes": {
        "paramExtraction": "single_val",
        "params": {
            # We expect a single string param
            "val": {"type": "string", "required": True}
        }
    },
   
     "satoshi_to_8_le": {
        "paramExtraction": "single_val",
        "params": {
            "val": {"type": "integer", "required": True}
        }
    },
   
    "double_sha256_hex": {
        "paramExtraction": "single_val",
        "params": {
            # We require a single string param: the hex-encoded data
            "val": {"type": "string", "required": True}
        }
    },
    "sha256_hex": {
        "paramExtraction": "single_val",
        "params": {
            "val": {"type": "string", "required": True}
        }
    },
    "sign_as_bitcoin_core_low_r": {
        "paramExtraction": "multi_val",
        "params": {
            "vals": {
                "type": "any",
                "required": True
        }
    }
    },
    "hash160_hex": {
        "paramExtraction": "single_val",
        "params": {
            "val": {"type": "string", "required": True}
        }
    },
    "varint_encoded_byte_length": {
        "paramExtraction": "single_val",
        "params": {
            "val": {"type": "string", "required": False}
        }
    },

    "script_verification": {
        "paramExtraction": "multi_val",  
        "params": {
            "vals": {"type": "any", "required": True}
        }
    },
    "op_code_select": {
    "paramExtraction": "single_val",
    "params": {
        "val": {"type": "string", "required": True}
    }
},

   "encode_script_push_data": {
    "paramExtraction": "single_val",
    "params": {
        "val": {"type": "string", "required": True}
    }
},
"int_to_script_bytes": {
    "paramExtraction": "single_val",
    "params": {
        "val": {"type": "integer", "required": True}
    }
},
"text_to_hex": {
    "paramExtraction": "single_val",
    "params": {
        "val": {"type": "string", "required": True}
    }
},
"blocks_to_sequence_number": {
    "paramExtraction": "single_val",
    "params": {
        "val": {"type": "integer", "required": True}
    }
},
"hours_to_sequence_number": {
    "paramExtraction": "single_val",
    "params": {
        "val": {"type": "number", "required": True}
    }
},

"hash160_to_p2sh_address": {
    "paramExtraction": "val_with_network",
    "params": {
        "val": {"type": "string", "required": True},
        "selectedNetwork": {"type": "string", "required": False}
    }
},
"date_to_unix_timestamp": {
    "paramExtraction": "single_val",
    "params": {
        "val": {"type": "string", "required": True}
    }
},
"reverse_bytes_4": {
    "paramExtraction": "single_val",
    "params": {
        "val": {"type": "string", "required": True}
    }
},
"opcode_to_value": {
        "paramExtraction": "single_val",
        "params": {
            "val": {"type": "string", "required": True}
        }
    },
"encode_sequence_block_flag": {
    "paramExtraction": "single_val",
    "params": {
        "val": {"type": "integer", "required": True}
    }
},
"encode_sequence_time_flag": {
    "paramExtraction": "single_val",
    "params": {
        "val": {"type": "integer", "required": True}
    }
},
"verify_signature": {
        "paramExtraction": "multi_val",
        "params": {
            "vals": {"type": "any", "required": True}
        }
    },

"extract_tx_field": {
    "paramExtraction": "multi_val",
    "params": {
        "vals": {"type": "any", "required": True}
    }
},
"compare_equal": {
    "paramExtraction": "multi_val",
    "params": { "vals": { "type": "any", "required": True } }
},

"compare_numbers": {
    "paramExtraction": "multi_val",
    "params": { "vals": { "type": "any", "required": True } }
},
"math_operation": {
    "paramExtraction": "multi_val",
    "params": { "vals": { "type": "any", "required": True } }
},

"hash160_to_p2pkh_address": {
    "paramExtraction": "val_with_network",
    "params": {
        "val": {"type": "string", "required": True},
        "selectedNetwork": {"type": "string", "required": False}
    }
},

"hash160_to_p2wpkh_address": {
    "paramExtraction": "val_with_network",
    "params": {
        "val": {"type": "string",  "required": True},
        "selectedNetwork": {"type": "string", "required": False},
    },
},

"sha256_to_p2wsh_address": {
    "paramExtraction": "val_with_network",
    "params": {
        "val": {"type": "string",  "required": True},
        "selectedNetwork": {"type": "string", "required": False},
    },
},

"hex_byte_length": {
    "doc": "Count how many *bytes* a hex‑encoded string represents.",
    "paramExtraction": "single_val",
    "params": {
        "val": {"type": "string", "required": True}
    }
},
"address_to_scriptpubkey": {
    "paramExtraction": "single_val",
    "params": {
        "val": {"type": "string", "required": True}
    }
},
"bip67_sort_pubkeys": {
    "paramExtraction": "multi_val",
    "params": {
        "vals": {"type": "any", "required": True}
    }
},
"check_result": {
    "paramExtraction": "multi_val",
    "params": { "vals": { "type": "any", "required": True } }
},


}
