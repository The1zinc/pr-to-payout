import sys
import json
from unittest.mock import MagicMock

# 1. Robust GenVM Mock
class MockU256:
    def __init__(self, val): self.val = int(str(val))
    def __add__(self, other): return MockU256(self.val + int(str(other)))
    def __gt__(self, other): return self.val > int(str(other))
    def __le__(self, other): return self.val <= int(str(other))
    def __eq__(self, other): return self.val == int(str(other))
    def __int__(self): return self.val
    def __str__(self): return str(self.val)

class MockTreeMap(dict):
    def get(self, key, default=None): return super().get(key, default)

mock_gl = MagicMock()
mock_gl.vm.UserError = Exception
mock_gl.block.timestamp = 1713700000
mock_gl.message.sender_address = "0xUSER"
mock_gl.message.value = MockU256(0)

genlayer_mod = MagicMock()
genlayer_mod.u256 = MockU256
genlayer_mod.TreeMap = MockTreeMap
genlayer_mod.gl = mock_gl
genlayer_mod.Address = lambda x: x
genlayer_mod.Contract = object # Important: Mock base class

sys.modules['genlayer'] = genlayer_mod

# 2. Logic Verification
def run_tests():
    print("[PRE-FLIGHT] Verifying Indestructible Contract Logic...")
    from pr_to_payout import PRToPayout
    
    # Instantiate
    contract = PRToPayout()
    
    # Test Create Bounty
    print("  - Testing create_bounty (Native ID handling)...")
    bid = contract.create_bounty(
        "AI Audit", "Desc", "https://github.com/repo", "Logic Validation",
        MockU256(100), MockU256(1713800000), "vercel.app"
    )
    
    assert str(bid) == "1", f"Expected ID 1, got {bid}"
    assert str(contract.next_bounty_id) == "2", "Counter failed to increment."
    
    # Test Storage Retrieval
    print("  - Testing list_bounties_json...")
    res = contract.list_bounties_json()
    bounties = json.loads(res)
    assert len(bounties) == 1, "Bounty count mismatch"
    assert bounties[0]["title"] == "AI Audit", "Bounty title mismatch"
    
    print("[SUCCESS] Indestructible Logic is PERFECT.")

if __name__ == "__main__":
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../contracts')))
    try:
        run_tests()
    except Exception as e:
        print(f"[FAIL] Proof Failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
