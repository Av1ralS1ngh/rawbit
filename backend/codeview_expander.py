# Builds an "educational" code view by prepending Base58/Bech32 helpers when referenced by the function.

from __future__ import annotations

import inspect
import re
from typing import Optional, Union, Type, Any
from types import (
    ModuleType,
    FunctionType,
    MethodType,
    TracebackType,
    FrameType,
    CodeType,
)

from calc_functions import calc_func as calc_ops

# Objects inspect.getsource accepts (mirrors inspect internals closely)
SourceObject = Union[
    ModuleType,
    Type[Any],       # classes / types
    MethodType,
    FunctionType,
    TracebackType,
    FrameType,
    CodeType,
]

# Helper names we consider part of the address/encoding lib
_BASE58_HELPERS = [
    "_b58encode",
    "_b58decode",
    "_b58check_encode",
    "_b58check_decode",
]
_BECH32_HELPERS = [
    "_bech32_hrp_expand",
    "_bech32_polymod",
    "_bech32_create_checksum",
    "_convertbits",
    "_bech32_encode",
    "_bech32_decode",
    "_hrp_for_network",
]

# Regex that detects usage of any helper name in the function source
_HELPER_PATTERN = re.compile(
    r"\b(" + "|".join(map(re.escape, _BASE58_HELPERS + _BECH32_HELPERS)) + r")\b"
)


def _get_source(fn: Optional[SourceObject]) -> Optional[str]:
    """Safely get source for a supported object; return None if not available."""
    if fn is None:
        return None
    try:
        src = inspect.getsource(fn)
    except Exception:
        return None
    return src.strip()


def _base58_bundle() -> str:
    parts = []
    # Constants pulled live so they match runtime
    if hasattr(calc_ops, "_B58_ALPHABET"):
        parts.append(f'_B58_ALPHABET = "{calc_ops._B58_ALPHABET}"')
        parts.append("_B58_IDX = {c: i for i, c in enumerate(_B58_ALPHABET)}")
    # Functions (live source from calc_ops)
    for name in _BASE58_HELPERS:
        src = _get_source(getattr(calc_ops, name, None))
        if src:
            parts.append(src)
    return "\n\n".join(parts).strip()


def _bech32_bundle() -> str:
    parts = []
    if hasattr(calc_ops, "_BECH32_CHARSET"):
        parts.append(f'_BECH32_CHARSET = "{calc_ops._BECH32_CHARSET}"')
        parts.append("_BECH32_IDX = {c: i for i, c in enumerate(_BECH32_CHARSET)}")
    if hasattr(calc_ops, "_BECH32M_CONST"):
        parts.append(f"_BECH32M_CONST = {calc_ops._BECH32M_CONST}")
    for name in _BECH32_HELPERS:
        src = _get_source(getattr(calc_ops, name, None))
        if src:
            parts.append(src)
    return "\n\n".join(parts).strip()


def expand_function_source(_func_obj: SourceObject, func_source: str) -> str:
    """
    If the given function's source mentions Base58/Bech32 helpers,
    return an expanded block with helper code prepended.
    Otherwise return the original source unchanged.
    """
    uses = set(_HELPER_PATTERN.findall(func_source or ""))
    if not uses:
        return func_source

    blocks = [
        "# --- Expanded view: helper code inlined for educational purposes ---",
       
    ]

    if uses.intersection(_BASE58_HELPERS):
        b58 = _base58_bundle()
        if b58:
            blocks.append("# --- Base58 / Base58Check helpers ---\n" + b58)

    if uses.intersection(_BECH32_HELPERS):
        b32 = _bech32_bundle()
        if b32:
            blocks.append("# --- Bech32 / Bech32m helpers ---\n" + b32)

    blocks.append("# --- Node function ---\n" + (func_source or ""))
    return "\n\n".join(blocks)
