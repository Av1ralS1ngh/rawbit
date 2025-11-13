"""Regression checks for saved flow JSONs.

We temporarily tweak specific nodes, assert the TXID + script trace change,
then restore the original values and expect the graph to return to baseline.

"""

import copy
import json
from pathlib import Path

import pytest

pytest.importorskip("bitcointx")
pytest.importorskip("secp256k1")
pytest.importorskip("ecdsa")

from backend import graph_logic

ROOT = Path(__file__).resolve().parents[2]
FLOW_SCENARIOS = [
    {
        "name": "hash_roundtrip.json",
        "path": ROOT
        / "backend"
        / "tests"
        / "my_tx_flows"
        / "hash_roundtrip.json",
        "node_changes": {
            "node_input": "deadbeef",
        },
        "txid_node": "node_hash",
        "script_node": "node_hash",
        "expected_results": {
            "txid": "9595c9df90075148eb06860365df33584b75bff782a510c6cd4883a419833d50",
            "script": "9595c9df90075148eb06860365df33584b75bff782a510c6cd4883a419833d50",
        },
    },
    {
        "name": "p1_Intro_P2PKH_and_P2PK.json",
        "path": ROOT / "src" / "my_tx_flows" / "p1_Intro_P2PKH_and_P2PK.json",
        "node_changes": {
            "node_8QSOHj19": "3",
            "node_IRajBmor": "144900",
        },
        "txid_node": "node_Jev5NWr0",
        "script_node": "node_xXU31KtR",
        "expected_results": {
            "txid": "518be8fbf6c23b366c589156c18f8ecec81fc73cbf145fc0ab1f960c93b56e6d",
            "script": "true",
        },
    },
    {
        "name": "p2_P2PK_and_P2SH_MultiSig.json",
        "path": ROOT / "src" / "my_tx_flows" / "p2_P2PK_and_P2SH_MultiSig.json",
        "node_changes": {
            "node_DyhEXHsp": "1",
        },
        "txid_node": "node_LlUQDzol",
        "script_node": "node_LlUQDzol",
        "expected_results": {
            "txid": "e6939a520c606a723ef86012c2b0a18c2050beb9f511f9ff79619e88aac9c5a9",
            "script": "e6939a520c606a723ef86012c2b0a18c2050beb9f511f9ff79619e88aac9c5a9",
        },
    },
    {
        "name": "p3_Locktime_Intro.json",
        "path": ROOT / "src" / "my_tx_flows" / "p3_Locktime_Intro.json",
        "node_changes": {
            "node_ZDBADVUZ": "3",
            "node_JeU1QNzG": "ffffffff",
        },
        "txid_node": "node_r1TThzov",
        "script_node": "node_0i002oyO",
        "expected_results": {
            "txid": "ae99e9812c26ed1a470edb2936db140fe81a42b7692009a12efaa2de000dd4f8",
            "script": "true",
        },
    },
    {
        "name": "p4_Script_timelocks_CLTV_CSV.json",
        "path": ROOT / "src" / "my_tx_flows" / "p4_Script_timelocks_CLTV_CSV.json",
        "node_changes": {
            "node_b4DjhE63": "1",
        },
        "txid_node": "node_Tf8lvGiS",
        "script_node": "node_Tf8lvGiS",
        "expected_results": {
            "txid": "3e9a3b8e6d6e5653b0d7baeab494e57f689a24485f015b19f19f06c241efb0f2",
            "script": "3e9a3b8e6d6e5653b0d7baeab494e57f689a24485f015b19f19f06c241efb0f2",
        },
    },
    {
        "name": "p5_OP_Return.json",
        "path": ROOT / "src" / "my_tx_flows" / "p5_OP_Return.json",
        "node_changes": {
            "node_rrQHlMQ5": "1",
        },
        "txid_node": "node_9xwXYZe8",
        "script_node": "node_9xwXYZe8",
        "expected_results": {
            "txid": "51cc809c60a045c7f403e7c59bdee4328abe4d9171cab1b9c0ba20801a7ab9dc",
            "script": "51cc809c60a045c7f403e7c59bdee4328abe4d9171cab1b9c0ba20801a7ab9dc",
        },
    },
    {
        "name": "p6_Spilman_channel.json",
        "path": ROOT / "src" / "my_tx_flows" / "p6_Spilman_channel.json",
        "node_changes": {
            "node_jjqgaie": "1",
        },
        "txid_node": "node_g6ki3br",
        "script_node": "node_g6ki3br",
        "expected_results": {
            "txid": "3044022003176946c2d3f037cc9f7843fbe732fdf37e375d12157d68d192a99f89877a7b02204f12c56c36bf2863c8eb3bff922a7482ce87d5e6ae340d574472938040812cc4",
            "script": "3044022003176946c2d3f037cc9f7843fbe732fdf37e375d12157d68d192a99f89877a7b02204f12c56c36bf2863c8eb3bff922a7482ce87d5e6ae340d574472938040812cc4",
        },
    },
    {
        "name": "p7_TX_malleability.json",
        "path": ROOT / "src" / "my_tx_flows" / "p7_TX_malleability.json",
        "node_changes": {
            "node_58jzaz3": "1",
        },
        "txid_node": "node_b7hfv3u",
        "script_node": "node_b7hfv3u",
        "expected_results": {
            "txid": "980db4668006fdb05156575e9e383a43c7db7e63cd1cb18cdc9fb101756d19aa",
            "script": "980db4668006fdb05156575e9e383a43c7db7e63cd1cb18cdc9fb101756d19aa",
        },
    },
    {
        "name": "p8_SegWit_intro.json",
        "path": ROOT / "src" / "my_tx_flows" / "p8_SegWit_intro.json",
        "node_changes": {
            "node_3onl59s": "1",
        },
        "txid_node": "node_dr1fd1j",
        "script_node": "node_dr1fd1j",
        "expected_results": {
            "txid": "f394abc38245d04f9fee116be164aba722d6f5690d590f6ce029be9c5ff00f83",
            "script": "f394abc38245d04f9fee116be164aba722d6f5690d590f6ce029be9c5ff00f83",
        },
    },
    {
        "name": "p10_Wrapped_Addresses_sign.json",
        "path": ROOT / "src" / "my_tx_flows" / "p10_Wrapped_Addresses.json",
        "node_changes": {
            "node_mtzyjvf": "1",
        },
        "txid_node": "node_th8cwvl",
        "script_node": "node_th8cwvl",
        "expected_results": {
            "txid": "3044022005433382dbf6bbb73a5050e8538502eb47c5f7d04d36065fd3677b6b14b9ed6b02204b407b063fb57ab9410b9123a22b2f8a2143a3229745a97c37ed3fb8ac5913f4",
            "script": "3044022005433382dbf6bbb73a5050e8538502eb47c5f7d04d36065fd3677b6b14b9ed6b02204b407b063fb57ab9410b9123a22b2f8a2143a3229745a97c37ed3fb8ac5913f4",
        },
    },
    {
        "name": "p10_Wrapped_Addresses_txid.json",
        "path": ROOT / "src" / "my_tx_flows" / "p10_Wrapped_Addresses.json",
        "node_changes": {
            "node_rt7lvsa": "1",
        },
        "txid_node": "node_q52iadg",
        "script_node": "node_q52iadg",
        "expected_results": {
            "txid": "22ae3a4783ec94559dbed3abe03a1506a57967b174137edca20c371609c7b531",
            "script": "22ae3a4783ec94559dbed3abe03a1506a57967b174137edca20c371609c7b531",
        },
    },
    {
        "name": "p9_SegWit_P2WSH.json",
        "path": ROOT / "src" / "my_tx_flows" / "p9_SegWit_P2WSH.json",
        "node_changes": {
            "node_xyeh1g3": "1",
            "node_qacl1zw": "109900",
        },
        "txid_node": "node_otzvcn1",
        "script_node": "node_rk6psd1",
        "expected_results": {
            "txid": "3c50e6388c999f62445227d8df82041f3bac41e5c260f17d557908b52956e6cb",
            "script": "true",
        },
    },
]


def _load_flow(path: Path):
    flow = json.loads(path.read_text())
    calc_nodes = [
        node
        for node in flow["nodes"]
        if node.get("data", {}).get("functionName")
    ]
    valid_ids = {node["id"] for node in calc_nodes}
    calc_edges = [
        edge
        for edge in flow["edges"]
        if edge.get("source") in valid_ids and edge.get("target") in valid_ids
    ]
    # Backfill literal values for nodes that were saved with cached results but
    # no upstream cable. Older fixtures sometimes rely on inputs["val"] without
    # mirroring it into the "value" field, which causes graph_logic to treat the
    # node as unwired and raise. Copy that cached literal so the node behaves as
    # a constant source during regression runs.
    incoming_by_target = {}
    for edge in calc_edges:
        incoming_by_target.setdefault(edge["target"], 0)
        incoming_by_target[edge["target"]] += 1
    for node in calc_nodes:
        data = node.get("data") or {}
        node_id = node.get("id")
        has_incoming = incoming_by_target.get(node_id, 0) > 0
        if has_incoming:
            continue
        if data.get("showField"):
            continue
        if "value" in data:
            continue
        literal = data.get("inputs", {}).get("val")
        if literal is not None:
            data["value"] = literal
    return calc_nodes, calc_edges


def _run(nodes, edges):
    updated_nodes, errors = graph_logic.bulk_calculate_logic(copy.deepcopy(nodes), edges)
    assert errors == []
    return {node["id"]: node for node in updated_nodes}


def _set_node_value(nodes, node_id, value):
    for node in nodes:
        if node["id"] == node_id:
            node_data = node.setdefault("data", {})
            node_data["value"] = value
            node_data.setdefault("inputs", {})["val"] = value
            node_data["dirty"] = True
            return
    pytest.fail(f"Node {node_id} not found in flow")


@pytest.mark.parametrize("scenario", FLOW_SCENARIOS, ids=lambda s: s["name"])
def test_flow_roundtrip_restores_txid_and_script_steps(scenario):
    nodes, edges = _load_flow(scenario["path"])

    baseline_map = _run(nodes, edges)

    txid_node_id = scenario["txid_node"]
    script_node_id = scenario["script_node"]

    original_txid = baseline_map[txid_node_id]["data"]["result"]
    original_script_data = baseline_map[script_node_id]["data"]
    original_script_result = original_script_data["result"]
    original_script_steps = copy.deepcopy(original_script_data.get("scriptDebugSteps"))

    expected = scenario.get("expected_results")
    if expected:
        if expected.get("txid") is not None:
            assert original_txid == expected["txid"]
        if expected.get("script") is not None:
            assert original_script_result == expected["script"]

    # Record original node values so we can restore them later
    original_inputs = {
        node_id: baseline_map[node_id]["data"]["result"]
        for node_id in scenario["node_changes"].keys()
    }

    scenario_nodes = copy.deepcopy(nodes)

    for node_id, new_value in scenario["node_changes"].items():
        _set_node_value(scenario_nodes, node_id, new_value)

    modified_map = _run(scenario_nodes, edges)
    modified_txid = modified_map[txid_node_id]["data"]["result"]
    modified_script_data = modified_map[script_node_id]["data"]
    modified_script_result = modified_script_data["result"]
    modified_script_steps = modified_script_data.get("scriptDebugSteps")

    assert modified_txid != original_txid
    assert (
        modified_script_result != original_script_result
        or modified_script_steps != original_script_steps
    )

    for node_id, original_value in original_inputs.items():
        _set_node_value(scenario_nodes, node_id, original_value)

    final_map = _run(scenario_nodes, edges)
    final_script_data = final_map[script_node_id]["data"]

    assert final_map[txid_node_id]["data"]["result"] == original_txid
    assert final_script_data["result"] == original_script_result
    assert final_script_data.get("scriptDebugSteps") == original_script_steps
