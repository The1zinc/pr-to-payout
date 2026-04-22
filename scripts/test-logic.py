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
def mock_decorator(f): return f
mock_gl.public.write = mock_decorator
mock_gl.public.write.payable = mock_decorator
mock_gl.public.view = mock_decorator
mock_gl.vm.UserError = Exception
mock_gl.block.timestamp = 1713700000
mock_gl.message.sender = "0xUSER"
mock_gl.message.value = MockU256(0)

# Create a clean mock module
genlayer_mod = MagicMock()
genlayer_mod.u256 = MockU256
genlayer_mod.DynArray = MockDynArray
genlayer_mod.TreeMap = MockTreeMap
genlayer_mod.gl = mock_gl
mock_gl.Contract = object
genlayer_mod.Address = lambda x: x

# Inject into sys.modules
sys.modules['genlayer'] = genlayer_mod

# 2. Test Logic
def run_tests():
    print("[TEST] Running Logic Validation...")
    # Import the contract AFTER mocks are set
    from pr_to_payout import PRToPayout
    
    contract = PRToPayout()
    # Manual call to __init__ since we are mocking Contract structure
    contract.__init__()
    
    # Test Create Bounty
    print("  - Testing create_bounty...")
    bid = contract.create_bounty(
        "AI Audit", "Desc", "https://github.com", "Criteria", 
        MockU256(100), MockU256(9999999999), "vercel.app", MockU256(1713700000)
    )
    
    assert str(bid) == "1", f"Expected ID 1, got {bid}"
    
    # Test Storage
    blob = contract.get_bounty_json(MockU256(1))
    import json
    bounty = json.loads(blob)
    assert bounty["title"] == "AI Audit", "Bounty title mismatch"
    assert contract.get_next_bounty_id() == "2", "next_bounty_id increment error"
    
    print("[SUCCESS] Logic Validation SUCCESSFUL!")

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
