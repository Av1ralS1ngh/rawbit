// src/components/sidebar-nodes.ts

import type { NodeTemplate } from "@/types";

/**
 * Node templates organized by categories:
 * - Input/Data
 * - Data Formatting
 * - Transaction Templates
 * - Cryptographic Operations
 * - Key & Address
 * - Utility
 */
export const allSidebarNodes: NodeTemplate[] = [
  // ------------------------------------------------------------------
  // INPUT/DATA
  // ------------------------------------------------------------------
  {
    functionName: "identity",
    label: "Identity",
    category: "Input/Data",
    subcategory: "",
    description: "Simple data entry node to accept raw user input",
    type: "calculation",
    nodeData: {
      functionName: "identity",
      title: "Identity",
      showField: true,
      numInputs: 0,
      value: "",

      version: 0,
      inputs: { val: "" },
      result: "",
      inputStructure: {
        ungrouped: [{ index: 0, label: "INPUT VALUE:", rows: 1 }],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "shadcn_group_node",
    label: "Group Node",
    category: "Input/Data",
    subcategory: "",
    description: "Container to group multiple nodes (no nesting).",
    type: "shadcnGroup",
    nodeData: {
      isGroup: true,
      groupFlash: false,
      width: 380,
      height: 220,
      title: "Group Node",
    },
  },
  {
    functionName: "shadcn_text_info",
    label: "Text Info Node",
    category: "Input/Data",
    subcategory: "",
    description: "Displays markdown text with adjustable font size",
    type: "shadcnTextInfo",
    nodeData: {
      content: "...",
      fontSize: 28,
      width: 300,
      height: 200,
      title: "Text Info Node",
    },
  },
  {
    functionName: "concat_all",
    label: "Concat",
    category: "Input/Data",
    subcategory: "",
    description: "Concatenate multiple elements (general purpose)",
    type: "calculation",
    nodeData: {
      functionName: "concat_all",
      title: "Concat",
      paramExtraction: "multi_val",
      numInputs: 2,
      inputs: { vals: [] },

      version: 0,
      result: "",
      inputStructure: {
        groups: [
          {
            title: "INPUTS[]",
            baseIndex: 0,
            expandable: true,
            fieldCountToAdd: 1,
            minInstances: 1,
            maxInstances: 99,
            fields: [
              {
                index: 0,
                label: "Value:",
                placeholder: "<input>",
                rows: 3,
              },
            ],
          },
        ],
        ungrouped: [],
        afterGroups: [],
      },
      groupInstances: { "INPUTS[]": 2 },
      groupInstanceKeys: { "INPUTS[]": [0, 100] },
      baseHeight: 80,
    },
  },

  // ------------------------------------------------------------------
  // DATA FORMATTING
  // ------------------------------------------------------------------
  {
    type: "opCodeNode",
    functionName: "op_code_select",
    label: "Opcode Sequence",
    category: "Data Formatting",
    subcategory: "",
    description: "Build a sequence of Opcodes and output the final hex.",
    nodeData: {
      functionName: "identity",
      paramExtraction: "single_val",
      title: "Opcode Sequence",
      inputs: { val: "" },
      result: "",
      value: "",
      opSequenceNames: [],

      groupInstances: {},
    },
  },
  {
    functionName: "uint32_to_little_endian_4_bytes",
    label: "Uint32 → LE-4",
    category: "Data Formatting",
    subcategory: "",
    description:
      "Convert uint32 to 4-byte LE hex (version, locktime, vout, sequence)",
    type: "calculation",
    nodeData: {
      functionName: "uint32_to_little_endian_4_bytes",
      title: "Uint32 → LE-4",
      numInputs: 1,

      value: "2",

      groupInstances: {},
      inputs: { val: "2" },
      result: "",
    },
  },
  {
    functionName: "encode_varint",
    label: "Int → VarInt",
    category: "Data Formatting",
    subcategory: "",
    description: "Creates variable-length integer for Bitcoin protocol",
    type: "calculation",
    nodeData: {
      functionName: "encode_varint",
      title: "Int → VarInt",
      numInputs: 1,

      groupInstances: {},
      result: "",
      inputs: { val: "1" },
    },
  },
  {
    functionName: "satoshi_to_8_le",
    label: "Satoshi → LE-8",
    category: "Data Formatting",
    subcategory: "",
    description: "Convert a satoshi value to 8-byte little-endian",
    type: "calculation",
    nodeData: {
      functionName: "satoshi_to_8_le",
      title: "Satoshi → LE-8",
      numInputs: 1,

      value: "50000000",

      groupInstances: {},
      inputs: { val: "50000000" },
      result: "",
    },
  },
  {
    functionName: "reverse_txid_bytes",
    label: "TXID → Reversed",
    category: "Data Formatting",
    subcategory: "",
    description: "Reverses byte order of transaction IDs",
    type: "calculation",
    nodeData: {
      functionName: "reverse_txid_bytes",
      title: "TXID → Reversed",
      numInputs: 1,

      groupInstances: {},
      result: "",
      inputs: { val: "" },
    },
  },
  {
    functionName: "varint_encoded_byte_length",
    label: "Data → VarInt Length",
    category: "Data Formatting",
    subcategory: "",
    description: "Length of hex as VarInt",
    type: "calculation",
    nodeData: {
      functionName: "varint_encoded_byte_length",
      title: "Data → VarInt Length",
      numInputs: 1,

      groupInstances: {},
      inputs: { val: "76a914..." },
      result: "",
    },
  },
  {
    functionName: "encode_script_push_data",
    label: "Data → Push Opcode",
    category: "Data Formatting",
    subcategory: "",
    description:
      "Get Bitcoin Script push opcode for hex data (returns only the opcode)",
    type: "calculation",
    nodeData: {
      functionName: "encode_script_push_data",
      title: "Data → Push Opcode",

      numInputs: 1,

      version: 0,
      inputs: { val: "" },
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Hex Data:",
            rows: 2,
            placeholder: "Enter hex data to calculate push opcode",
          },
        ],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "int_to_script_bytes",
    label: "Int → ScriptBytes",
    category: "Data Formatting",
    subcategory: "",
    description:
      "Unsigned integer → minimal little-endian hex (no push-opcode). " +
      "Use for CSV, CLTV, arithmetic opcodes, etc.",
    type: "calculation",
    nodeData: {
      functionName: "int_to_script_bytes",
      title: "Int → ScriptBytes",

      numInputs: 1,

      version: 0,
      inputs: { val: 0 },
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Integer value:",
            rows: 1,
            placeholder: "e.g. 4404774",
          },
        ],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "text_to_hex",
    label: "Text → Hex",
    category: "Data Formatting",
    subcategory: "",
    description:
      "Convert UTF-8 text to hex encoding (e.g., '2009' → '32303039')",
    type: "calculation",
    nodeData: {
      functionName: "text_to_hex",
      title: "Text → Hex",

      numInputs: 1,

      version: 0,
      inputs: { val: "" },
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Text input:",
            rows: 1,
            placeholder: "e.g., 2009",
          },
        ],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "blocks_to_sequence_number", // Changed
    label: "Blocks → Relative Lock", // Changed
    category: "Data Formatting",
    subcategory: "",
    description: "Block-based relative lock value for nSequence/CSV",
    type: "calculation",
    nodeData: {
      functionName: "blocks_to_sequence_number", // Changed
      title: "Blocks → Relative Lock", // Changed

      numInputs: 1,

      version: 0,
      inputs: { val: 10 },
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Delay (blocks):",
            rows: 1,
            placeholder: "e.g., 10",
          },
        ],
      },
      groupInstances: {},
    },
  },

  // ------------------------------------------------------------------
  // TRANSACTION TEMPLATES
  // ------------------------------------------------------------------
  {
    functionName: "concat_all",
    label: "TX Template legacy",
    category: "Transaction Templates",
    subcategory: "",
    description:
      "Example specialised concat node with fields for version, input count, etc.",
    type: "calculation",
    nodeData: {
      functionName: "concat_all",
      title: "TX Template legacy",
      paramExtraction: "multi_val",
      numInputs: 12,
      inputs: { vals: [] },

      version: 0,
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "VERSION[4]:",
            rows: 1,
            comment:
              "Transaction version (4-byte LE). Legacy-only template: no marker/flag, no witnesses.",
          },
          {
            index: 10,
            label: "INPUT_COUNT (VarInt):",
            rows: 1,
            small: true,
            comment: "Number of inputs (varint).",
          },
        ],
        betweenGroups: {
          "INPUTS[]": [
            {
              index: 2_000,
              label: "OUTPUT_COUNT (VarInt):",
              rows: 1,
              small: true,
              comment: "Number of outputs (varint).",
            },
          ],
        },
        afterGroups: [
          {
            index: 4_000,
            label: "LOCKTIME[4]:",
            placeholder: "00000000",
            rows: 1,
            comment: "nLockTime (4-byte LE). Use 00000000 if none.",
          },
        ],
        groups: [
          {
            title: "INPUTS[]",
            baseIndex: 1_000,
            expandable: true,
            fieldCountToAdd: 5,
            minInstances: 1,
            maxInstances: 10,
            fields: [
              {
                index: 0,
                label: "TXID[32]:",
                placeholder: "Prev TX ID",
                rows: 2,
                comment:
                  "Previous transaction ID in little-endian (reversed byte order).",
              },
              {
                index: 10,
                label: "VOUT[4]:",
                placeholder: "00000000",
                rows: 1,
                comment: "Output index (4-byte LE).",
              },
              {
                index: 20,
                label: "SCRIPT_LENGTH (VarInt):",
                rows: 1,
                allowEmpty00: true,
                comment:
                  "Length of scriptSig in bytes (varint). For legacy spends this should be non-zero.",
              },
              {
                index: 30,
                label: "SCRIPT_SIG[]:",
                placeholder: "<sig> <pk>",
                rows: 3,
                allowEmptyBlank: true,
                comment:
                  "Unlocking script. P2PKH: <sig> <pubkey>. P2SH: push redeem script (non-SegWit).",
              },
              {
                index: 40,
                label: "SEQUENCE[4]:",
                placeholder: "ffffffff",
                rows: 1,
                comment:
                  "nSequence (4-byte LE). ffffffff = final; lower values enable locktime/RBF.",
              },
            ],
          },
          {
            title: "OUTPUTS[]",
            baseIndex: 3_000,
            expandable: true,
            fieldCountToAdd: 3,
            minInstances: 1,
            maxInstances: 10,
            fields: [
              {
                index: 0,
                label: "AMOUNT[8]:",
                placeholder: "Satoshis (hex)",
                rows: 1,
                comment: "Amount in satoshis (8-byte LE).",
              },
              {
                index: 10,
                label: "SCRIPT_PUBKEY_LENGTH:",
                rows: 1,
                small: true,
                comment: "Length of scriptPubKey (varint).",
              },
              {
                index: 20,
                label: "SCRIPT_PUBKEY[]:",
                placeholder: "Locking script",
                rows: 3,
                comment:
                  "Locking script, e.g., P2PKH (76a9...88ac) or P2SH (a9...87).",
              },
            ],
          },
        ],
      },
      groupInstances: { "INPUTS[]": 1, "OUTPUTS[]": 1 },
      groupInstanceKeys: { "INPUTS[]": [1_000], "OUTPUTS[]": [3_000] },
      baseHeight: 120,
    },
  },
  {
    functionName: "concat_all",
    label: "TX Template",
    category: "Transaction Templates",
    subcategory: "",
    description:
      "Assembles any Bitcoin transaction: legacy, SegWit, or mixed. For SegWit/mixed, include marker+flag and witnesses. Legacy inputs need '00' witness.",
    type: "calculation",
    nodeData: {
      functionName: "concat_all",
      title: "TX Template",
      paramExtraction: "multi_val",
      numInputs: 15,
      inputs: { vals: [] },

      version: 0,
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "VERSION[4]:",
            rows: 1,
            placeholder: "02000000",
            comment: "Transaction version",
          },
          {
            index: 10,
            label: "MARKER[1]:",
            rows: 1,
            placeholder: "00 or empty",
            small: true,
            allowEmptyBlank: true,
            comment:
              "Include ONLY if ANY input is SegWit (00), empty for legacy-only",
          },
          {
            index: 20,
            label: "FLAG[1]:",
            rows: 1,
            placeholder: "01 or empty",
            small: true,
            allowEmptyBlank: true,
            comment:
              "Include ONLY if ANY input is SegWit (01), empty for legacy-only",
          },
          {
            index: 30,
            label: "INPUT_COUNT:",
            rows: 1,
            placeholder: "01",
            small: true,
            comment: "Number of inputs (varint)",
          },
        ],
        groups: [
          {
            title: "INPUTS[]",
            baseIndex: 1000,
            expandable: true,
            fieldCountToAdd: 5,
            minInstances: 1,
            maxInstances: 10,
            fields: [
              {
                index: 0,
                label: "TXID[32]:",
                placeholder: "Previous TX ID (reversed)",
                rows: 2,
              },
              {
                index: 10,
                label: "VOUT[4]:",
                placeholder: "00000000",
                rows: 1,
              },
              {
                index: 20,
                label: "SCRIPT_LENGTH:",
                rows: 1,
                allowEmpty00: true,
                placeholder: "00 for SegWit, varies for others",
                comment:
                  "00=SegWit, 17=P2SH-P2WPKH, 23=P2SH-P2WSH, varies=legacy",
              },
              {
                index: 30,
                label: "SCRIPT_SIG:",
                placeholder: "Empty for native SegWit",
                rows: 2,
                allowEmptyBlank: true,
                comment:
                  "Native SegWit: empty | Nested: 0014[hash] | Legacy: full script",
              },
              {
                index: 40,
                label: "SEQUENCE[4]:",
                placeholder: "fdffffff",
                rows: 1,
              },
            ],
          },
          {
            title: "OUTPUTS[]",
            baseIndex: 3000,
            expandable: true,
            fieldCountToAdd: 3,
            minInstances: 1,
            maxInstances: 10,
            fields: [
              {
                index: 0,
                label: "AMOUNT[8]:",
                placeholder: "Satoshis (hex, LE)",
                rows: 1,
              },
              {
                index: 10,
                label: "SCRIPT_LENGTH:",
                rows: 1,
                small: true,
                placeholder: "19",
              },
              {
                index: 20,
                label: "SCRIPT_PUBKEY:",
                placeholder: "Locking script",
                rows: 2,
              },
            ],
          },
          {
            title: "WITNESSES[]",
            baseIndex: 5000,
            expandable: true,
            fieldCountToAdd: 1,
            minInstances: 1,
            maxInstances: 10,
            fields: [
              {
                index: 0,
                label: "WITNESS_DATA:",
                placeholder: "SegWit: actual witness | Legacy: 00",
                rows: 3,
                allowEmptyBlank: true,
                comment:
                  "⚠️ EVERY input needs witness! Legacy='00', SegWit=actual data",
              },
            ],
          },
        ],
        betweenGroups: {
          "INPUTS[]": [
            {
              index: 2000,
              label: "OUTPUT_COUNT:",
              rows: 1,
              placeholder: "01",
              small: true,
              comment: "Number of outputs (varint)",
            },
          ],
        },
        afterGroups: [
          {
            index: 6000,
            label: "LOCKTIME[4]:",
            placeholder: "00000000",
            rows: 1,
          },
        ],
      },
      groupInstances: {
        "INPUTS[]": 1,
        "OUTPUTS[]": 1,
        "WITNESSES[]": 1,
      },
      groupInstanceKeys: {
        "INPUTS[]": [1000],
        "OUTPUTS[]": [3000],
        "WITNESSES[]": [5000],
      },
      baseHeight: 150,
    },
  },
  {
    functionName: "concat_all",
    label: "P2WPKH Witness",
    category: "Transaction Templates",
    subcategory: "SegWit",
    description: "Witness data for P2WPKH input (signature + pubkey)",
    type: "calculation",
    nodeData: {
      functionName: "concat_all",
      title: "P2WPKH Witness",
      paramExtraction: "multi_val",
      numInputs: 5,
      inputs: { vals: [] },

      version: 0,
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "ITEM_COUNT:",
            placeholder: "02",
            value: "02",
            rows: 1,
            small: true,
          },
          {
            index: 10,
            label: "SIG_LENGTH:",
            placeholder: "48",
            rows: 1,
            small: true,
          },
          {
            index: 20,
            label: "SIGNATURE+SIGHASH:",
            placeholder: "304502...01",
            rows: 3,
          },
          {
            index: 30,
            label: "PUBKEY_LENGTH:",
            placeholder: "21",
            value: "21",
            rows: 1,
            small: true,
          },
          {
            index: 40,
            label: "PUBKEY:",
            placeholder: "02a1b2c3...",
            rows: 2,
          },
        ],
        groups: [],
        afterGroups: [],
      },
      groupInstances: {},
      baseHeight: 100,
    },
  },
  {
    functionName: "concat_all",
    label: "P2WSH Witness",
    category: "Transaction Templates",
    subcategory: "SegWit",
    description: "Witness data for P2WSH input (flexible for any script type)",
    type: "calculation",
    nodeData: {
      functionName: "concat_all",
      title: "P2WSH Witness",
      paramExtraction: "multi_val",
      numInputs: 5, // item_count + 2 initial pairs
      inputs: { vals: [] },

      version: 0,
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "ITEM_COUNT:",
            placeholder: "03, 04, etc",
            rows: 1,
            comment: "Total witness stack items",
          },
        ],
        groups: [
          {
            title: "WITNESS_ITEMS[]",
            baseIndex: 1000,
            expandable: true,
            fieldCountToAdd: 2,
            minInstances: 1,
            maxInstances: 20,
            fields: [
              {
                index: 0,
                label: "ITEM LENGTH (VarInt):",
                placeholder: "00 (empty), 47 (sig), 21 (pubkey), etc",
                rows: 1,
                comment: "VarInt length of this item",
              },
              {
                index: 10,
                label: "ITEM BYTES:",
                placeholder: "Actual bytes for this item (empty if length=00)",
                rows: 3,
                allowEmptyBlank: true,
                comment: "Leave empty when length is 00 (empty item)",
              },
            ],
          },
        ],
        afterGroups: [],
      },
      groupInstances: {
        "WITNESS_ITEMS[]": 2,
      },
      groupInstanceKeys: {
        "WITNESS_ITEMS[]": [1000, 1100],
      },
      baseHeight: 120,
    },
  },
  // DATA TO SIGN (SEGWIT) Node - Builds BIP143 signing data WITHOUT sighash
  {
    functionName: "concat_all",
    label: "Data to Sign (SegWit)",
    category: "Transaction Templates",
    subcategory: "Components",
    description:
      "Builds BIP143 signing message for ONE SegWit input (without SIGHASH - add separately)",
    type: "calculation",
    nodeData: {
      functionName: "concat_all",
      title: "Data to Sign (SegWit)",
      paramExtraction: "multi_val",
      numInputs: 10, // Reduced from 11 - no SIGHASH
      inputs: { vals: [] },

      version: 0,
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "VERSION[4]:",
            rows: 1,
            placeholder: "02000000",
            comment: "Transaction version (little-endian)",
          },
          {
            index: 10,
            label: "HASH_PREVOUTS[32]:",
            rows: 2,
            placeholder: "SHA256d of all inputs' outpoints",
            comment: "⚡ SHARED: Same for all inputs with SIGHASH_ALL",
          },
          {
            index: 20,
            label: "HASH_SEQUENCE[32]:",
            rows: 2,
            placeholder: "SHA256d of all inputs' sequences",
            comment: "⚡ SHARED: Same for all inputs with SIGHASH_ALL",
          },
          {
            index: 30,
            label: "OUTPOINT[36]:",
            rows: 2,
            placeholder: "TXID (32 bytes) + VOUT (4 bytes)",
            comment: "🔄 UNIQUE: This specific input's outpoint",
          },
          {
            index: 40,
            label: "SCRIPTCODE_LENGTH:",
            rows: 1,
            placeholder: "19 for P2WPKH, varies for P2WSH",
            comment: "Varint length of the script code",
          },
          {
            index: 50,
            label: "SCRIPTCODE:",
            rows: 3,
            placeholder: "P2WPKH: 1976a914[hash]88ac | P2WSH: witnessScript",
            comment:
              "🔄 UNIQUE: P2WPKH uses standard script, P2WSH uses the actual script",
          },
          {
            index: 60,
            label: "AMOUNT[8]:",
            rows: 1,
            placeholder: "Satoshis in little-endian",
            comment: "🔄 UNIQUE: Value of the UTXO being spent",
          },
          {
            index: 70,
            label: "SEQUENCE[4]:",
            rows: 1,
            placeholder: "fdffffff",
            comment: "🔄 UNIQUE: This input's sequence number",
          },
          {
            index: 80,
            label: "HASH_OUTPUTS[32]:",
            rows: 2,
            placeholder: "SHA256d of all outputs",
            comment: "⚡ SHARED: Same for all inputs with SIGHASH_ALL",
          },
          {
            index: 90,
            label: "LOCKTIME[4]:",
            rows: 1,
            placeholder: "00000000",
            comment: "Transaction locktime",
          },
        ],
        groups: [],
        afterGroups: [],
      },
      groupInstances: {},
      baseHeight: 200,
    },
  },

  // ------------------------------------------------------------------
  // CRYPTOGRAPHIC OPERATIONS
  // ------------------------------------------------------------------
  {
    functionName: "hash160_hex",
    label: "Data → HASH160",
    category: "Cryptographic Operations",
    subcategory: "",
    description: "Performs RIPEMD160(SHA256) on input hex",
    type: "calculation",
    nodeData: {
      functionName: "hash160_hex",
      title: "Data → HASH160",
      paramExtraction: "single_val",

      numInputs: 1,

      inputs: { val: "" },
      result: "",
      inputStructure: {
        ungrouped: [{ index: 0, label: "INPUT HEX:", rows: 2 }],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "double_sha256_hex",
    label: "Data → SHA-256d",
    category: "Cryptographic Operations",
    subcategory: "",
    description: "SHA256(SHA256()) on input hex",
    type: "calculation",
    nodeData: {
      functionName: "double_sha256_hex",
      title: "Data → SHA-256d",

      numInputs: 1,

      version: 0,
      inputs: { val: "" },
      result: "",
      inputStructure: {
        ungrouped: [{ index: 0, label: "Input Hex:", rows: 2 }],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "sha256_hex",
    label: "Data → SHA-256",
    category: "Cryptographic Operations",
    subcategory: "",
    description: "Compute a single SHA-256 of hex-encoded data",
    type: "calculation",
    nodeData: {
      functionName: "sha256_hex",
      title: "Data → SHA-256",

      numInputs: 1,

      version: 0,
      inputs: { val: "" },
      result: "",
      inputStructure: {
        ungrouped: [{ index: 0, label: "Input Hex:", rows: 2 }],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "sign_as_bitcoin_core_low_r",
    label: "Sign TX (Low-R)",
    category: "Cryptographic Operations",
    subcategory: "",
    description: "ECDSA signature with low-R style, like Bitcoin Core",
    type: "calculation",
    nodeData: {
      functionName: "sign_as_bitcoin_core_low_r",
      title: "Sign TX (Low-R)",
      paramExtraction: "multi_val",
      numInputs: 2,

      inputs: {
        vals: ["", ""],
      },
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Private Key (32 bytes hex):",
            placeholder: "<privkey hex>",
            rows: 2,
          },
          {
            index: 1,
            label: "Message Hash (32 bytes hex):",
            placeholder: "<32-byte hash>",
            rows: 2,
          },
        ],
      },
      groupInstances: {},
      result: "",
    },
  },

  // ------------------------------------------------------------------
  // KEY & ADDRESS
  // ------------------------------------------------------------------
  {
    functionName: "random_256",
    label: "Random 32 Bytes",
    category: "Key & Address",
    subcategory: "",
    description:
      "Generates random 256-bit (32 bytes) entropy suitable for a Bitcoin private key / secret key",
    type: "calculation",
    nodeData: {
      functionName: "random_256",
      title: "Random 32 Bytes",
      hasRegenerate: true,
      forceRegenerate: true,
      dirty: true,
      numInputs: 0,
      groupInstances: {},
      result: "",
    },
  },
  {
    functionName: "public_key_from_private_key",
    label: "PrivKey → PubKey",
    category: "Key & Address",
    subcategory: "",
    description: "Derives compressed public key from private key",
    type: "calculation",
    nodeData: {
      functionName: "public_key_from_private_key",
      title: "PrivKey → PubKey",
      hasRegenerate: false,
      forceRegenerate: false,
      numInputs: 1,

      groupInstances: {},
      result: "",
      inputs: { val: "" },
    },
  },

  // ------------------------------------------------------------------
  // UTILITY
  // ------------------------------------------------------------------
  {
    functionName: "script_verification",
    label: "Verify Script",
    category: "Cryptographic Operations",
    subcategory: "",
    description: "Bitcoin script debugger/verifier",
    type: "calculation",
    nodeData: {
      functionName: "script_verification",
      title: "Verify Script",
      paramExtraction: "multi_val",
      numInputs: 6, // Updated from 4 to 6
      inputs: { vals: ["", "", "", "0", "", ""] }, // Added two more empty strings
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "scriptSig_hex",
            rows: 3,
            placeholder: "Hex-encoded scriptSig",
            allowEmptyBlank: true,
          },
          {
            index: 1,
            label: "scriptPubKey_hex",
            rows: 3,
            placeholder: "Hex-encoded scriptPubKey",
          },
          {
            index: 2,
            label: "tx_hex",
            rows: 3,
            placeholder: "Hex-encoded Transaction",
          },
          {
            index: 3,
            label: "input_index_to_verify",
            rows: 1,
            placeholder: "0",
            unconnectable: true,
          },
          {
            index: 4,
            label: "exclude_flags",
            rows: 1,
            placeholder: "e.g., WITNESS,CLEANSTACK",
            unconnectable: true,
          },
          {
            index: 5,
            label: "spent_amount_sats",
            rows: 1,
            placeholder: "Amount in satoshis (for SegWit/Taproot)",
            unconnectable: false, // This CAN be connected for dynamic amounts
            allowEmptyBlank: true,
          },
        ],
        groups: [],
        afterGroups: [],
      },
      groupInstances: {},
      result: "",

      error: false,
    },
  },
  {
    functionName: "hash160_to_p2sh_address",
    label: "HASH160 → P2SH Address",
    category: "Key & Address",
    subcategory: "",
    description:
      "Builds a legacy P2SH address from the 20‑byte HASH160 of a redeem script (works for nested‑SegWit too). ",
    type: "calculation",
    nodeData: {
      functionName: "hash160_to_p2sh_address",
      title: "HASH160 → P2SH Address",
      numInputs: 1,

      networkDependent: true,
      selectedNetwork: "testnet",

      groupInstances: {},
      result: "",
      inputs: {
        selectedNetwork: "testnet",
        val: "",
      },
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Redeem HASH160:",
            rows: 2,
            placeholder: "20-byte hash (40 hex characters)",
            comment:
              "Hash of the redeem script. Use Data → HASH160 if you have the script bytes.",
          },
        ],
      },
    },
  },
  {
    functionName: "date_to_unix_timestamp",
    label: "Date → Unix Time",
    category: "Data Formatting",
    subcategory: "",
    description: "Convert human-readable date to Unix timestamp for CLTV",
    type: "calculation",
    nodeData: {
      functionName: "date_to_unix_timestamp",
      title: "Date → Unix Time",

      numInputs: 1,

      version: 0,
      inputs: { val: "2025-01-01T00:00:00Z" },
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Date (UTC):",
            rows: 1,
            placeholder: "2025-01-01T00:00:00Z",
          },
        ],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "reverse_bytes_4",
    label: "4-Byte → Reversed",
    category: "Data Formatting",
    subcategory: "",
    description: "Reverse byte order of 4-byte hex values (sequence, locktime)",
    type: "calculation",
    nodeData: {
      functionName: "reverse_bytes_4",
      title: "4-Byte → Reversed",
      numInputs: 1,

      version: 0,
      inputs: { val: "" },
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "4-byte hex:",
            rows: 1,
            placeholder: "e.g., fffffffd",
          },
        ],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "hours_to_sequence_number",
    label: "Hours → Relative Lock",
    category: "Data Formatting",
    subcategory: "",
    description:
      "Time-based relative lock for nSequence/CSV. Accepts hours (decimals allowed, e.g., 1.5 for 90 minutes)",
    type: "calculation",
    nodeData: {
      functionName: "hours_to_sequence_number",
      title: "Hours → Relative Lock",

      numInputs: 1,

      version: 0,
      inputs: { val: 1 },
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Delay (hours):",
            rows: 1,
            placeholder: "e.g., 13 or 1.5",
          },
        ],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "opcode_to_value",
    label: "Opcode → Value",
    category: "Data Formatting",
    subcategory: "",
    description:
      "Convert numeric opcodes (OP_0 to OP_16, OP_1NEGATE) to their integer values",
    type: "calculation",
    nodeData: {
      functionName: "opcode_to_value",
      title: "Opcode → Value",

      numInputs: 1,

      version: 0,
      inputs: { val: "" },
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Opcode hex:",
            rows: 1,
            placeholder: "e.g., 5a (OP_10)",
          },
        ],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "encode_sequence_block_flag",
    label: "Sequence → Block Flag",
    category: "Data Formatting",
    subcategory: "",
    description: "Prepare sequence value for block-based CSV (no modification)",
    type: "calculation",
    nodeData: {
      functionName: "encode_sequence_block_flag",
      title: "Sequence → Block Flag",
      numInputs: 1,

      version: 0,
      inputs: { val: "" },
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Sequence value (blocks):",
            rows: 1,
            placeholder: "e.g., 10 or 4320",
          },
        ],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "encode_sequence_time_flag",
    label: "Sequence → Time Flag",
    category: "Data Formatting",
    subcategory: "",
    description:
      "Add time-based flag (bit 22) to sequence value for time-based CSV",
    type: "calculation",
    nodeData: {
      functionName: "encode_sequence_time_flag",
      title: "Sequence → Time Flag",
      numInputs: 1,

      version: 0,
      inputs: { val: "" },
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Sequence value (time units):",
            rows: 1,
            placeholder: "e.g., 8 or 5063",
          },
        ],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "verify_signature",
    label: "Verify Signature",
    category: "Cryptographic Operations",
    subcategory: "",
    description: "ECDSA signature verification (Bitcoin-style DER, secp256k1)",
    type: "calculation",
    nodeData: {
      functionName: "verify_signature",
      title: "Verify Signature",
      paramExtraction: "multi_val",
      numInputs: 3,

      inputs: {
        vals: ["", "", ""],
      },
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Public Key (33 or 65 bytes hex):",
            placeholder: "<pubkey hex>",
            rows: 2,
          },
          {
            index: 1,
            label: "Message Hash (32 bytes hex):",
            placeholder: "<32-byte hash>",
            rows: 2,
          },
          {
            index: 2,
            label: "Signature (DER hex):",
            placeholder: "<DER signature hex>",
            rows: 2,
          },
        ],
      },
      groupInstances: {},
      result: "",
    },
  },
  {
    /* ─ TX FIELD EXTRACT ────────────────────────────────────────────── */
    functionName: "extract_tx_field",
    label: "TX Field Extract",
    category: "Utility",
    subcategory: "",
    description: "Pull a single value out of a raw Bitcoin transaction",
    type: "calculation", // still rendered by CalculationNode
    nodeData: {
      functionName: "extract_tx_field",
      title: "TX Field Extract",
      paramExtraction: "multi_val",
      numInputs: 3, // [rawTx, fieldName, index]

      result: "",
      inputs: { vals: ["", "txid", ""] }, // index starts blank

      inputStructure: {
        ungrouped: [
          /* 0 ─ raw transaction hex (can be cabled) */
          {
            index: 0,
            label: "Raw TX (hex):",
            rows: 4,
            placeholder: "<transaction hex>",
          },

          /* 1 ─ dropdown selector (no cables) */
          {
            index: 1,
            label: "Field name:",
            unconnectable: true,
            options: [
              "version",
              "locktime",
              "txid",
              "input_count",
              "output_count",
              "vin.txid",
              "vin.vout",
              "vin.scriptSig",
              "vin.sequence",
              "vout.value",
              "vout.scriptPubKey",
              "raw_no_witness",
            ],
          },

          /* 2 ─ optional index (manual only, no checkbox, no handle) */
          {
            index: 2,
            label: "Index (opt):",
            rows: 1,
            placeholder: "0",
            unconnectable: true, // ← removes the input handle
            // no allowEmptyBlank → the “Ø” checkbox disappears
          },
        ],
      },

      groupInstances: {},
    },
  },
  /* ------------------------------------------------------------------
   * Add/replace this entry in sidebar-nodes.ts
   * → 2-plus inputs, user-expandable like “Concat”
   * ---------------------------------------------------------------- */
  {
    functionName: "compare_equal",
    label: "Compare (==)",
    category: "Utility",
    subcategory: "",
    description: "Checks that ALL inputs are byte-for-byte identical",
    type: "calculation",
    nodeData: {
      functionName: "compare_equal",
      title: "Compare (==)",
      paramExtraction: "multi_val",
      numInputs: 2, // initial pair
      inputs: { vals: [] },
      result: "",
      /* one expandable group VALUES[] (min 2, max 12) */
      inputStructure: {
        groups: [
          {
            title: "VALUES[]",
            baseIndex: 0,
            expandable: true,
            fieldCountToAdd: 1,
            minInstances: 2,
            maxInstances: 12,
            fields: [
              {
                index: 0,
                label: "Value:",
                rows: 2,
                placeholder: "<hex or text>",
              },
            ],
          },
        ],
        ungrouped: [],
        afterGroups: [],
      },
      groupInstances: { "VALUES[]": 2 },
      groupInstanceKeys: { "VALUES[]": [0, 100] },
    },
  },
  {
    /* ─ Compare Numbers ─ */
    functionName: "compare_numbers",
    label: "Compare Numbers",
    category: "Utility",
    subcategory: "",
    description: "Tests a numeric relation (<, >, ≤, ≥) between two values",
    type: "calculation",
    nodeData: {
      functionName: "compare_numbers",
      title: "Compare Numbers",
      paramExtraction: "multi_val",
      numInputs: 3, // [left, operator, right]
      inputs: { vals: ["", "<", ""] },
      result: "",

      inputStructure: {
        ungrouped: [
          { index: 0, label: "Left value:", rows: 1, placeholder: "e.g. 5" },
          {
            index: 1,
            label: "Operator:",
            unconnectable: true, // dropdown, no cables
            options: ["<", ">", "<=", ">="],
          },
          { index: 2, label: "Right value:", rows: 1, placeholder: "e.g. 10" },
        ],
      },

      groupInstances: {},
    },
  },

  {
    /* ─ Math Operation ─ */
    functionName: "math_operation",
    label: "Math Operation",
    category: "Utility",
    subcategory: "",
    description:
      "Performs basic math operations: add/plus (+), subtract/minus (−), multiply/times (×), or divide (÷) on two values",
    type: "calculation",
    nodeData: {
      functionName: "math_operation",
      title: "Math Operation",
      paramExtraction: "multi_val",
      numInputs: 3, // [left, operator, right]
      inputs: { vals: ["", "+", ""] },
      result: "",
      inputStructure: {
        ungrouped: [
          { index: 0, label: "Left value:", rows: 1, placeholder: "e.g. 5" },
          {
            index: 1,
            label: "Operator:",
            unconnectable: true,
            options: ["+", "-", "*", "/"],
          },
          { index: 2, label: "Right value:", rows: 1, placeholder: "e.g. 10" },
        ],
      },
      groupInstances: {},
    },
  },

  // Specialized nodes for Bitcoin transaction building

  // PREVOUTS Node - Concatenates all inputs' outpoints (txid + vout)
  {
    functionName: "concat_all",
    label: "PREVOUTS Builder",
    category: "Transaction Templates",
    subcategory: "Components",
    description:
      "Builds concatenated prevouts for transaction signing (all txid+vout pairs)",
    type: "calculation",
    nodeData: {
      functionName: "concat_all",
      title: "PREVOUTS Builder",
      paramExtraction: "multi_val",
      numInputs: 2, // Initial: 1 input (2 fields)
      inputs: { vals: [] },

      version: 0,
      result: "",
      inputStructure: {
        ungrouped: [],
        groups: [
          {
            title: "PREVOUTS[]",
            baseIndex: 0,
            expandable: true,
            fieldCountToAdd: 2,
            minInstances: 1,
            maxInstances: 20,
            fields: [
              {
                index: 0,
                label: "TXID[32]:",
                placeholder: "Previous transaction ID (reversed)",
                rows: 2,
                comment: "32-byte transaction ID in reversed byte order",
              },
              {
                index: 10,
                label: "VOUT[4]:",
                placeholder: "00000000",
                rows: 1,
                comment: "Output index in little-endian (4 bytes)",
              },
            ],
          },
        ],
        afterGroups: [],
      },
      groupInstances: { "PREVOUTS[]": 1 },
      groupInstanceKeys: { "PREVOUTS[]": [0] },
      baseHeight: 100,
    },
  },

  // SEQUENCE Node - Concatenates all inputs' sequence values
  {
    functionName: "concat_all",
    label: "SEQUENCE Builder",
    category: "Transaction Templates",
    subcategory: "Components",
    description: "Builds concatenated sequence values for transaction signing",
    type: "calculation",
    nodeData: {
      functionName: "concat_all",
      title: "SEQUENCE Builder",
      paramExtraction: "multi_val",
      numInputs: 1, // Initial: 1 sequence
      inputs: { vals: [] },

      version: 0,
      result: "",
      inputStructure: {
        ungrouped: [],
        groups: [
          {
            title: "SEQUENCES[]",
            baseIndex: 0,
            expandable: true,
            fieldCountToAdd: 1,
            minInstances: 1,
            maxInstances: 20,
            fields: [
              {
                index: 0,
                label: "SEQUENCE[4]:",
                placeholder: "fdffffff",
                rows: 1,
                comment:
                  "4-byte sequence (LE). Use fdffffff for RBF, ffffffff for final",
              },
            ],
          },
        ],
        afterGroups: [],
      },
      groupInstances: { "SEQUENCES[]": 1 },
      groupInstanceKeys: { "SEQUENCES[]": [0] },
      baseHeight: 80,
    },
  },

  // OUTPOINT Node - Single outpoint (txid + vout) for specific input signing
  {
    functionName: "concat_all",
    label: "OUTPOINT Builder",
    category: "Transaction Templates",
    subcategory: "Components",
    description:
      "Builds a single outpoint (txid+vout) for BIP143 signing of specific input",
    type: "calculation",
    nodeData: {
      functionName: "concat_all",
      title: "OUTPOINT Builder",
      paramExtraction: "multi_val",
      numInputs: 2,
      inputs: { vals: [] },

      version: 0,
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "TXID[32]:",
            placeholder: "Transaction ID of UTXO being spent (reversed)",
            rows: 2,
            comment: "The specific input's previous transaction ID",
          },
          {
            index: 10,
            label: "VOUT[4]:",
            placeholder: "00000000",
            rows: 1,
            comment: "The specific input's output index (little-endian)",
          },
        ],
        groups: [],
        afterGroups: [],
      },
      groupInstances: {},
      baseHeight: 80,
    },
  },

  // OUTPUTS Node - Concatenates all outputs (amount + script_length + script)
  {
    functionName: "concat_all",
    label: "OUTPUTS Builder",
    category: "Transaction Templates",
    subcategory: "Components",
    description:
      "Builds concatenated outputs for transaction (amount+script_length+script)",
    type: "calculation",
    nodeData: {
      functionName: "concat_all",
      title: "OUTPUTS Builder",
      paramExtraction: "multi_val",
      numInputs: 3, // Initial: 1 output (3 fields)
      inputs: { vals: [] },

      version: 0,
      result: "",
      inputStructure: {
        ungrouped: [],
        groups: [
          {
            title: "OUTPUTS[]",
            baseIndex: 0,
            expandable: true,
            fieldCountToAdd: 3,
            minInstances: 1,
            maxInstances: 20,
            fields: [
              {
                index: 0,
                label: "AMOUNT[8]:",
                placeholder: "e.g., 3069020000000000",
                rows: 1,
                comment: "Amount in satoshis as 8-byte little-endian hex",
              },
              {
                index: 10,
                label: "SCRIPT_LENGTH:",
                placeholder: "e.g., 16",
                rows: 1,
                small: true,
                comment:
                  "Script length as varint (usually 16 for P2WPKH, 19 for P2PKH)",
              },
              {
                index: 20,
                label: "SCRIPT_PUBKEY:",
                placeholder: "e.g., 0014[20-byte-hash]",
                rows: 2,
                comment: "The locking script (scriptPubKey)",
              },
            ],
          },
        ],
        afterGroups: [],
      },
      groupInstances: { "OUTPUTS[]": 1 },
      groupInstanceKeys: { "OUTPUTS[]": [0] },
      baseHeight: 100,
    },
  },
  // SCRIPTCODE Node - Builds the script code for BIP143 signing
  {
    functionName: "concat_all",
    label: "SCRIPTCODE Builder",
    category: "Transaction Templates",
    subcategory: "Components",
    description:
      "Builds scriptcode for BIP143 signing. P2WPKH: standard P2PKH script. P2WSH: the witness script",
    type: "calculation",
    nodeData: {
      functionName: "concat_all",
      title: "SCRIPTCODE Builder",
      paramExtraction: "multi_val",
      numInputs: 4, // For P2WPKH: 4 parts
      inputs: { vals: [] },

      version: 0,
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "PREFIX:",
            placeholder: "76a9 for P2WPKH, empty for P2WSH",
            rows: 1,
            allowEmptyBlank: true,
            comment: "OP_DUP OP_HASH160 for P2WPKH, leave empty for P2WSH",
          },
          {
            index: 10,
            label: "PUSH_OPCODE:",
            placeholder: "14 for P2WPKH, leave empty for P2WSH",
            rows: 1,
            allowEmptyBlank: true,
            comment:
              "Push opcode: 14 for 20-byte hash, or appropriate for P2WSH script",
          },
          {
            index: 20,
            label: "SCRIPT/HASH:",
            placeholder: "20-byte hash for P2WPKH, full script for P2WSH",
            rows: 3,
            comment:
              "P2WPKH: 20-byte pubkey hash | P2WSH: complete witness script",
          },
          {
            index: 30,
            label: "SUFFIX:",
            placeholder: "88ac for P2WPKH, empty for P2WSH",
            rows: 1,
            allowEmptyBlank: true,
            comment:
              "OP_EQUALVERIFY OP_CHECKSIG for P2WPKH, leave empty for P2WSH",
          },
        ],
        groups: [],
        afterGroups: [],
        // Add a help text section
        helpText:
          "P2WPKH: 76a9 | 14 | [20-byte-hash] | 88ac\nP2WSH: [empty] | [empty] | [witness-script] | [empty]",
      },
      groupInstances: {},
      baseHeight: 120,
    },
  },
  {
    functionName: "hash160_to_p2pkh_address",
    label: "HASH160 → P2PKH Address",
    category: "Key & Address",
    subcategory: "",
    description: "Creates a Base58 P2PKH address from a 20-byte HASH160",
    type: "calculation",
    nodeData: {
      functionName: "hash160_to_p2pkh_address",
      title: "HASH160 → P2PKH Address",
      numInputs: 1,

      networkDependent: true,
      selectedNetwork: "testnet",

      groupInstances: {},
      result: "",
      inputs: {
        selectedNetwork: "testnet",
        val: "",
      },
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "HASH160:",
            rows: 2,
            placeholder: "20-byte hash (40 hex characters)",
          },
        ],
      },
    },
  },
  {
    functionName: "hash160_to_p2wpkh_address",
    label: "HASH160 → P2WPKH Address",
    category: "Key & Address",
    subcategory: "",
    description:
      "Creates a bech32 SegWit v0 P2WPKH address from a 20‑byte HASH160",
    type: "calculation",
    nodeData: {
      functionName: "hash160_to_p2wpkh_address",
      title: "HASH160 → P2WPKH Address",
      numInputs: 1,

      networkDependent: true,
      selectedNetwork: "testnet",

      groupInstances: {},
      result: "",
      inputs: { selectedNetwork: "testnet", val: "" },
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "HASH160:",
            rows: 2,
            placeholder: "20‑byte hash (40 hex)",
          },
        ],
      },
    },
  },
  {
    functionName: "sha256_to_p2wsh_address",
    label: "SHA256 → P2WSH Address",
    category: "Key & Address",
    subcategory: "",
    description:
      "Creates a bech32 SegWit v0 P2WSH address from a 32‑byte SHA‑256 script‑hash",
    type: "calculation",
    nodeData: {
      functionName: "sha256_to_p2wsh_address",
      title: "SHA256 → P2WSH Address",
      numInputs: 1,

      networkDependent: true,
      selectedNetwork: "testnet",

      groupInstances: {},
      result: "",
      inputs: { selectedNetwork: "testnet", val: "" },
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "SHA‑256 (script‑hash):",
            rows: 2,
            placeholder: "32‑byte hash (64 hex)",
          },
        ],
      },
    },
  },
  {
    functionName: "hex_byte_length",
    label: "Hex → Byte Length",
    category: "Data Formatting",
    subcategory: "",
    description:
      "Returns the number of bytes a hex‑encoded string represents (whitespace ignored).",
    type: "calculation",

    nodeData: {
      // ↓ this must match the back‑end function & function_specs entry
      functionName: "hex_byte_length",
      title: "Hex → Byte Length",
      numInputs: 1,

      groupInstances: {},
      result: "",

      // initial input values
      inputs: { val: "" },

      // UI layout for the config panel
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Hex string:",
            rows: 4,
            placeholder: "e.g. 0200000001…",
          },
        ],
      },
    },
  },
  {
    functionName: "address_to_scriptpubkey",
    label: "Address → ScriptPubKey",
    category: "Key & Address",
    subcategory: "",
    description:
      "Converts any Bitcoin address to its scriptPubKey. Auto-detects P2PKH, P2SH, P2WPKH, P2WSH, P2TR (Taproot), and future witness versions",
    type: "calculation",
    nodeData: {
      functionName: "address_to_scriptpubkey",
      title: "Address → ScriptPubKey",
      numInputs: 1,

      version: 0,
      inputs: { val: "" },
      result: "",
      inputStructure: {
        ungrouped: [
          {
            index: 0,
            label: "Bitcoin Address:",
            rows: 2,
            placeholder: "Any address format (1..., 3..., bc1...)",
          },
        ],
      },
      groupInstances: {},
    },
  },
  {
    functionName: "bip67_sort_pubkeys",
    label: "BIP-67 PubKey Sort",
    category: "Key & Address",
    subcategory: "",
    description:
      "Sort public keys lexicographically per BIP-67 for deterministic multisig. Shows original positions after sorting (e.g., '2,4,1,3')",
    type: "calculation",
    nodeData: {
      functionName: "bip67_sort_pubkeys",
      title: "BIP-67 PubKey Sort",
      paramExtraction: "multi_val",
      numInputs: 2, // Start with 2 pubkeys
      inputs: { vals: [] },

      version: 0,
      result: "",
      hasOutputHandle: false, // No output handle as requested
      inputStructure: {
        groups: [
          {
            title: "PUBLIC_KEYS[]",
            baseIndex: 0,
            expandable: true,
            fieldCountToAdd: 1,
            minInstances: 2, // At least 2 for multisig
            maxInstances: 20, // Reasonable max for multisig
            fields: [
              {
                index: 0,
                label: "Public Key:",
                placeholder: "02/03... (compressed) or 04... (uncompressed)",
                rows: 2,
                comment:
                  "33-byte compressed or 65-byte uncompressed public key in hex",
              },
            ],
          },
        ],
        ungrouped: [],
        afterGroups: [],
      },
      groupInstances: { "PUBLIC_KEYS[]": 2 },
      groupInstanceKeys: { "PUBLIC_KEYS[]": [0, 100] },
      baseHeight: 100,
    },
  },
  // In sidebar-nodes.ts, add this in the Utility category:

  {
    functionName: "check_result",
    label: "Check Result",
    category: "Utility",
    subcategory: "",
    description:
      "Raises an error if ANY input is not 'true'. Use to convert comparison results to errors.",
    type: "calculation",
    nodeData: {
      functionName: "check_result",
      title: "Check Result",
      paramExtraction: "multi_val",
      numInputs: 1, // initial single input
      inputs: { vals: [] },
      result: "",
      /* one expandable group VALUES[] (min 1, max 12) - same as Compare (==) */
      inputStructure: {
        groups: [
          {
            title: "VALUES[]",
            baseIndex: 0,
            expandable: true,
            fieldCountToAdd: 1,
            minInstances: 1,
            maxInstances: 12,
            fields: [
              {
                index: 0,
                label: "Value:",
                rows: 1,
                placeholder: "true/false",
              },
            ],
          },
        ],
        ungrouped: [],
        afterGroups: [],
      },
      groupInstances: { "VALUES[]": 1 },
      groupInstanceKeys: { "VALUES[]": [0] },
    },
  },
];
