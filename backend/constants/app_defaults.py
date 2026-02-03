DEFAULT_EXTRACT_PROMPT_PREFIX = "You are an extraction agent. Convert the document into JSON only, matching this schema and using null when unavailable:"
DEFAULT_EXTRACT_PROMPT_SUFFIX = ""

DEFAULT_SCHEMA_FIELDS = (
    ("employee_name", "string"),
    ("employer_name", "string"),
    ("pay_period_start", "string"),
    ("pay_period_end", "string"),
    ("pay_date", "string"),
    ("base_pay", "number"),
    ("gross_pay", "number"),
    ("net_pay", "number"),
    ("pre_tax_401k", "number"),
    ("roth_401k", "number"),
    ("hsa_contribution", "number"),
    ("ytd_gross_pay", "number"),
    ("total_taxes", "number"),
    ("total_deductions", "number"),
    ("currency", "string"),
)

RSU_SCHEMA_FIELDS = (
    ("participant_name", "string"),
    ("employer_name", "string"),
    ("grant_date", "string"),
    ("total_shares_granted", "number"),
    ("vesting_schedule_description", "string"),
    ("next_vesting_date", "string"),
    ("next_vesting_shares", "number"),
    ("current_stock_price", "number"),
)

DEFAULT_POLICY_TOP_K = 4
DEFAULT_POLICY_CHUNK_SIZE = 1000
DEFAULT_POLICY_CHUNK_OVERLAP = 200
DEFAULT_POLICY_PROMPT_PREFIX = "You are the Vesting Buddy Policy Scout. Find the exact sections with mathematical rules for 401(k) match, HSA contribution, and vesting. Return raw policy text only. If multiple conflicting policies are found, return both and flag the conflict."
DEFAULT_POLICY_PROMPT_SUFFIX = "Search for keywords: Match, Contribute, Employer Contribution, Tiered, %, Vesting, Cliff, Graded. If a section mentions matching without a percentage, include the headers above and below it. Return only raw text."
DEFAULT_POLICY_QUESTION = "Find sections with match formulas, HSA contributions, and vesting schedules."

DEFAULT_STRATEGIST_PROMPT_PREFIX = "You are the Strategist. Use the policy answer and paystub data to produce a step-by-step reasoning chain with math, then a single actionable recommendation. Avoid stock picking."
DEFAULT_STRATEGIST_PROMPT_SUFFIX = "Format as: Reasoning Steps: 1) ... 2) ... 3) ... Recommendation: ..."

DEFAULT_GUARDRAIL_PROMPT = "You are a content safety classifier. Your task is to analyze the given text and determine if it violates the following content restrictions: 1. Do not allow the terms {blocked_terms}. 2. Do not allow discussion of {blocked_topics}. Respond with a JSON object in the format: {{\"status\": \"allowed/blocked\", \"violations\": [\"list\", \"of\", \"violations\"]}}. If the text is safe, 'status' should be 'allowed' and 'violations' should be an empty list."

DEFAULT_GUARDRAIL_BLOCKLIST = (
    "apple",
    "tesla",
    "amazon",
    "meta",
    "nvidia",
    "bitcoin",
    "ethereum",
    "aapl",
    "tsla",
    "amzn",
    "nvda",
    "btc",
    "eth",
)
DEFAULT_GUARDRAIL_REPLACEMENT = "Avoid individual stock picks. Prefer diversified index funds or employer plan defaults aligned with your risk tolerance."
