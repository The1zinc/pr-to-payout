import sys
from unittest.mock import MagicMock

# 1. Define Mocks
class MockU256:
    def __init__(self, val): self.val = int(val)
    def __add__(self, other): return MockU256(self.val + int(other))
    def __sub__(self, other): return MockU256(self.val - int(other))
    def __gt__(self, other): return self.val > int(other)
    def __ge__(self, other): return self.val >= int(other)
    def __eq__(self, other): return self.val == int(other)
    def __ne__(self, other): return self.val != int(other)
    def __int__(self): return self.val
    def __str__(self): return str(self.val)

class MockDynArray(list):
    def __init__(self, *args): super().__init__([])
    def append(self, item): super().append(item)

class MockTreeMap(dict):
    def __init__(self, *args): super().__init__({})
    def get(self, key, default=None): return super().get(key, default)

mock_gl = MagicMock()
mock_gl.vm.UserError = Exception
mock_gl.block.timestamp = 1713700000
mock_gl.message.sender_address = "0xUSER"
mock_gl.message.value = MockU256(0)

genlayer_mod = MagicMock()
genlayer_mod.u256 = MockU256
genlayer_mod.DynArray = MockDynArray
genlayer_mod.TreeMap = MockTreeMap
genlayer_mod.gl = mock_gl
genlayer_mod.Address = lambda x: x
genlayer_mod.Contract = object # Base class mock

sys.modules['genlayer'] = genlayer_mod

# 2. Test Logic
def run_tests():
    print("[TEST] Running Logic Validation...")
    from pr_to_payout import PRToPayout
    
    # In our SDK-Standard version, state is initialized at class-level
    # but since PRToPayout inherits from 'object' in our mock, 
    # we need to make sure the class-level attributes exist on the instance.
    contract = PRToPayout()
    
    # Test Create Bounty
    print("  - Testing create_bounty...")
    bid = contract.create_bounty(
        "AI Audit", "Desc", "https://github.com", "Criteria", 
        MockU256(100), MockU256(9999999999), "vercel.app"
    )
    
    assert str(bid) == "1", f"Expected ID 1, got {bid}"
    
    # Test Storage Persistence (Bounty List)
    print("  - Testing list_bounties_json...")
    list_json = contract.list_bounties_json()
    import json
    bounties = json.loads(list_json)
    assert len(bounties) == 1, "Bounty not added to list"
    assert bounties[0]["title"] == "AI Audit", "Bounty data mismatch"
    
    print("[SUCCESS] Logic Validation PASSED!")

if __name__ == "__main__":
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../contracts')))
    try:
        run_tests()
    except Exception as e:
        print(f"[FAIL] Logic Test FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
