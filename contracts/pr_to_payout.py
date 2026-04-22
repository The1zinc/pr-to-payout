# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


# EVM interface for sending GEN to an EOA (external message via ghost contract)
@gl.evm.contract_interface
class _Recipient:
    class View:
        pass
    class Write:
        pass


class PRToPayout(gl.Contract):
    # ── Storage (all GenVM-compliant types) ──────────────────────────
    next_bounty_id: bigint
    next_submission_id: bigint
    bounties: TreeMap[bigint, str]          # bounty_id -> JSON blob
    submissions: TreeMap[bigint, str]       # submission_id -> JSON blob
    bounty_to_submission: TreeMap[bigint, bigint]  # bounty_id -> submission_id
    bounty_escrow: TreeMap[bigint, u256]    # bounty_id -> escrowed wei

    # ── Constructor ──────────────────────────────────────────────────
    def __init__(self):
        self.next_bounty_id = 1
        self.next_submission_id = 1

    # ── Helpers (private) ────────────────────────────────────────────

    def _load_bounty(self, bounty_id: bigint) -> dict:
        raw = self.bounties.get(bounty_id, "")
        if not raw:
            raise gl.vm.UserError("Bounty not found")
        return json.loads(raw)

    def _save_bounty(self, bounty_id: bigint, data: dict) -> None:
        self.bounties[bounty_id] = json.dumps(data, sort_keys=True)

    def _load_submission(self, sub_id: bigint) -> dict:
        raw = self.submissions.get(sub_id, "")
        if not raw:
            raise gl.vm.UserError("Submission not found")
        return json.loads(raw)

    def _save_submission(self, sub_id: bigint, data: dict) -> None:
        self.submissions[sub_id] = json.dumps(data, sort_keys=True)

    def _require_sender(self, expected_hex: str, label: str) -> None:
        sender = str(gl.message.sender_address)
        if sender.lower() != expected_hex.lower():
            raise gl.vm.UserError(f"Only the {label} can perform this action")

    # ── Write Methods ────────────────────────────────────────────────

    @gl.public.write
    def create_bounty(
        self,
        title: str,
        description: str,
        repo_url: str,
        acceptance_criteria: str,
        payout_amount: int,
        deadline_timestamp: int,
        allowed_domains_csv: str,
        created_at: int,
    ) -> None:
        bounty_id = self.next_bounty_id
        allowed_domains = [
            d.strip() for d in allowed_domains_csv.split(",") if d.strip()
        ]
        data = {
            "id": str(bounty_id),
            "sponsor": str(gl.message.sender_address),
            "title": title,
            "description": description,
            "repo_url": repo_url,
            "acceptance_criteria": acceptance_criteria,
            "payout_amount": str(payout_amount),
            "deadline_timestamp": str(deadline_timestamp),
            "allowed_domains": allowed_domains,
            "status": "open",
            "chosen_submission_id": "0",
            "latest_submission_id": "0",
            "created_at": str(created_at),
        }
        self._save_bounty(bounty_id, data)
        self.next_bounty_id = bounty_id + 1

    @gl.public.write.payable
    def fund_bounty(self, bounty_id: int) -> None:
        bid = bigint(bounty_id)
        bounty = self._load_bounty(bid)
        self._require_sender(bounty["sponsor"], "sponsor")
        if bounty["status"] != "open":
            raise gl.vm.UserError("Bounty must be in open status to fund")
        received = gl.message.value
        if received == u256(0):
            raise gl.vm.UserError("Must send GEN to fund the bounty")
        self.bounty_escrow[bid] = received
        bounty["status"] = "funded"
        self._save_bounty(bid, bounty)

    @gl.public.write
    def submit_proof(
        self,
        bounty_id: int,
        pr_url: str,
        deploy_url: str,
        note: str,
        created_at: int,
    ) -> None:
        bid = bigint(bounty_id)
        bounty = self._load_bounty(bid)
        if bounty["status"] != "funded":
            raise gl.vm.UserError("Bounty must be funded to accept submissions")
        # Check no existing submission
        existing_sub = self.bounty_to_submission.get(bid, bigint(0))
        if existing_sub != 0:
            raise gl.vm.UserError("A submission already exists for this bounty")

        sub_id = self.next_submission_id
        builder_addr = str(gl.message.sender_address)
        criteria = bounty["acceptance_criteria"]
        repo = bounty["repo_url"]

        # Copy data to memory for use inside non-deterministic block
        mem_pr_url = str(pr_url)
        mem_deploy_url = str(deploy_url)
        mem_criteria = str(criteria)
        mem_repo = str(repo)

        # ── AI Evaluation via non-deterministic consensus ────────
        def leader_fn():
            # Fetch the PR page
            pr_evidence = ""
            try:
                pr_resp = gl.nondet.web.get(mem_pr_url)
                pr_evidence = pr_resp[:3000] if isinstance(pr_resp, str) else str(pr_resp)[:3000]
            except Exception:
                pr_evidence = "PR page could not be fetched"

            # Fetch the deployment page
            deploy_evidence = ""
            try:
                deploy_resp = gl.nondet.web.get(mem_deploy_url)
                deploy_evidence = deploy_resp[:3000] if isinstance(deploy_resp, str) else str(deploy_resp)[:3000]
            except Exception:
                deploy_evidence = "Deployment page could not be fetched"

            prompt = f"""You are evaluating a bounty submission for a GitHub PR bounty platform.

BOUNTY REPOSITORY: {mem_repo}
ACCEPTANCE CRITERIA: {mem_criteria}

SUBMITTED PR URL: {mem_pr_url}
SUBMITTED DEPLOYMENT URL: {mem_deploy_url}

PR PAGE EVIDENCE (first 3000 chars):
{pr_evidence}

DEPLOYMENT PAGE EVIDENCE (first 3000 chars):
{deploy_evidence}

Evaluate whether this submission meets the acceptance criteria.
Consider:
1. Is the PR URL valid and points to the correct repository?
2. Is the deployment URL reachable?
3. Does the evidence suggest the acceptance criteria are met?

Respond ONLY with a JSON object:
{{"verdict": "approved" or "rejected" or "needs_manual_review", "reasoning": "brief explanation", "evidence_summary": "what you checked", "checked_urls": [list of URLs checked]}}"""

            result = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(result, dict):
                raise gl.vm.UserError("LLM returned invalid format")
            return result

        def validator_fn(leaders_res) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            leader_data = leaders_res.calldata
            if not isinstance(leader_data, dict):
                return False
            # Validate structure
            if "verdict" not in leader_data:
                return False
            if leader_data["verdict"] not in ("approved", "rejected", "needs_manual_review"):
                return False
            # Run our own evaluation
            try:
                my_result = leader_fn()
                # Agree if verdicts match
                return my_result.get("verdict") == leader_data.get("verdict")
            except Exception:
                return False

        eval_result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        # ── Deterministic state updates after consensus ──────────
        verdict = eval_result.get("verdict", "needs_manual_review")
        reasoning = eval_result.get("reasoning", "")
        evidence_summary = eval_result.get("evidence_summary", "")
        checked_urls = eval_result.get("checked_urls", [])
        if not isinstance(checked_urls, list):
            checked_urls = []

        # Determine submission status and bounty status
        if verdict == "approved":
            sub_status = "approved"
            bounty_status = "approved"
        elif verdict == "rejected":
            sub_status = "rejected"
            bounty_status = "rejected"
        else:
            sub_status = "pending"
            bounty_status = "submitted"

        submission_data = {
            "id": str(sub_id),
            "bounty_id": str(bounty_id),
            "builder": builder_addr,
            "pr_url": pr_url,
            "deploy_url": deploy_url,
            "note": note,
            "status": sub_status,
            "verdict": verdict,
            "reasoning": reasoning,
            "evidence_summary": evidence_summary,
            "checked_urls": checked_urls,
            "created_at": str(created_at),
            "evaluated_at": str(created_at),
            "appeal_used": False,
        }
        self._save_submission(sub_id, submission_data)
        self.bounty_to_submission[bid] = sub_id
        self.next_submission_id = sub_id + 1

        bounty["status"] = bounty_status
        bounty["latest_submission_id"] = str(sub_id)
        if verdict == "approved":
            bounty["chosen_submission_id"] = str(sub_id)
        self._save_bounty(bid, bounty)

        # Auto-payout on approval
        if verdict == "approved":
            escrowed = self.bounty_escrow.get(bid, u256(0))
            if escrowed > u256(0):
                self.bounty_escrow[bid] = u256(0)
                _Recipient(Address(builder_addr)).emit_transfer(value=escrowed)

    @gl.public.write
    def cancel_bounty(self, bounty_id: int) -> None:
        bid = bigint(bounty_id)
        bounty = self._load_bounty(bid)
        self._require_sender(bounty["sponsor"], "sponsor")
        if bounty["status"] not in ("open", "funded"):
            raise gl.vm.UserError("Cannot cancel bounty in current status")
        # If funded but no submission, allow cancel
        existing_sub = self.bounty_to_submission.get(bid, bigint(0))
        if bounty["status"] == "funded" and existing_sub != 0:
            raise gl.vm.UserError("Cannot cancel after a submission has been made")
        # Refund if escrowed
        escrowed = self.bounty_escrow.get(bid, u256(0))
        if escrowed > u256(0):
            self.bounty_escrow[bid] = u256(0)
            sponsor_addr = bounty["sponsor"]
            _Recipient(Address(sponsor_addr)).emit_transfer(value=escrowed)
        bounty["status"] = "cancelled"
        self._save_bounty(bid, bounty)

    @gl.public.write
    def refund_bounty(self, bounty_id: int) -> None:
        bid = bigint(bounty_id)
        bounty = self._load_bounty(bid)
        self._require_sender(bounty["sponsor"], "sponsor")
        # Allow refund if rejected or if deadline passed while funded
        if bounty["status"] not in ("rejected", "funded"):
            raise gl.vm.UserError("Refund not available for current status")
        escrowed = self.bounty_escrow.get(bid, u256(0))
        if escrowed == u256(0):
            raise gl.vm.UserError("No escrowed funds to refund")
        self.bounty_escrow[bid] = u256(0)
        bounty["status"] = "refunded"
        self._save_bounty(bid, bounty)
        sponsor_addr = bounty["sponsor"]
        _Recipient(Address(sponsor_addr)).emit_transfer(value=escrowed)

    @gl.public.write
    def appeal_submission(self, bounty_id: int) -> None:
        bid = bigint(bounty_id)
        bounty = self._load_bounty(bid)
        sub_id = self.bounty_to_submission.get(bid, bigint(0))
        if sub_id == 0:
            raise gl.vm.UserError("No submission to appeal")
        submission = self._load_submission(sub_id)
        if submission.get("appeal_used", False):
            raise gl.vm.UserError("Appeal already used")
        self._require_sender(submission["builder"], "builder")
        if submission["verdict"] == "approved":
            raise gl.vm.UserError("Cannot appeal an approved submission")

        criteria = bounty["acceptance_criteria"]
        repo = bounty["repo_url"]
        mem_pr_url = submission["pr_url"]
        mem_deploy_url = submission["deploy_url"]
        mem_criteria = str(criteria)
        mem_repo = str(repo)
        mem_prev_reasoning = submission.get("reasoning", "")

        # Re-evaluate with appeal context
        def leader_fn():
            pr_evidence = ""
            try:
                pr_resp = gl.nondet.web.get(mem_pr_url)
                pr_evidence = pr_resp[:3000] if isinstance(pr_resp, str) else str(pr_resp)[:3000]
            except Exception:
                pr_evidence = "PR page could not be fetched"

            deploy_evidence = ""
            try:
                deploy_resp = gl.nondet.web.get(mem_deploy_url)
                deploy_evidence = deploy_resp[:3000] if isinstance(deploy_resp, str) else str(deploy_resp)[:3000]
            except Exception:
                deploy_evidence = "Deployment page could not be fetched"

            prompt = f"""You are RE-EVALUATING a bounty submission on appeal. The builder believes the initial verdict was incorrect.

BOUNTY REPOSITORY: {mem_repo}
ACCEPTANCE CRITERIA: {mem_criteria}

SUBMITTED PR URL: {mem_pr_url}
SUBMITTED DEPLOYMENT URL: {mem_deploy_url}

PREVIOUS VERDICT REASONING: {mem_prev_reasoning}

PR PAGE EVIDENCE (first 3000 chars):
{pr_evidence}

DEPLOYMENT PAGE EVIDENCE (first 3000 chars):
{deploy_evidence}

Re-evaluate this submission with fresh eyes. The previous verdict may have been wrong.
Respond ONLY with a JSON object:
{{"verdict": "approved" or "rejected" or "needs_manual_review", "reasoning": "brief explanation", "evidence_summary": "what you checked", "checked_urls": [list of URLs checked]}}"""

            result = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(result, dict):
                raise gl.vm.UserError("LLM returned invalid format")
            return result

        def validator_fn(leaders_res) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            leader_data = leaders_res.calldata
            if not isinstance(leader_data, dict):
                return False
            if "verdict" not in leader_data:
                return False
            if leader_data["verdict"] not in ("approved", "rejected", "needs_manual_review"):
                return False
            try:
                my_result = leader_fn()
                return my_result.get("verdict") == leader_data.get("verdict")
            except Exception:
                return False

        eval_result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        # Update submission
        verdict = eval_result.get("verdict", "needs_manual_review")
        submission["verdict"] = verdict
        submission["reasoning"] = eval_result.get("reasoning", "")
        submission["evidence_summary"] = eval_result.get("evidence_summary", "")
        submission["checked_urls"] = eval_result.get("checked_urls", [])
        submission["appeal_used"] = True

        if verdict == "approved":
            submission["status"] = "approved"
            bounty["status"] = "approved"
            bounty["chosen_submission_id"] = str(sub_id)
            # Auto-payout
            escrowed = self.bounty_escrow.get(bid, u256(0))
            if escrowed > u256(0):
                self.bounty_escrow[bid] = u256(0)
                _Recipient(Address(submission["builder"])).emit_transfer(value=escrowed)
        elif verdict == "rejected":
            submission["status"] = "rejected"
            bounty["status"] = "rejected"
        else:
            submission["status"] = "pending"
            bounty["status"] = "submitted"

        self._save_submission(sub_id, submission)
        self._save_bounty(bid, bounty)

    # ── View Methods ─────────────────────────────────────────────────

    @gl.public.view
    def get_next_bounty_id(self) -> int:
        return self.next_bounty_id

    @gl.public.view
    def list_bounties_json(self) -> str:
        result = []
        for bid in self.bounties:
            raw = self.bounties[bid]
            if raw:
                result.append(json.loads(raw))
        return json.dumps(result)

    @gl.public.view
    def get_bounty_json(self, bounty_id: int) -> str:
        bid = bigint(bounty_id)
        raw = self.bounties.get(bid, "")
        if not raw:
            return json.dumps(None)
        return raw

    @gl.public.view
    def get_submission_for_bounty_json(self, bounty_id: int) -> str:
        bid = bigint(bounty_id)
        sub_id = self.bounty_to_submission.get(bid, bigint(0))
        if sub_id == 0:
            return json.dumps(None)
        raw = self.submissions.get(sub_id, "")
        if not raw:
            return json.dumps(None)
        return raw
