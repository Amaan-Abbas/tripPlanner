from typing import Dict, Any, Optional
from backend.agents.prompts import TRANSPORT_STAY_SYSTEM_PROMPT, TRANSPORT_STAY_USER_PROMPT

def run_transport_stay_agent(
    api_key: str,
    destination: str,
    budget_tier: str,
    duration: int,
    accommodation_budget_total: float,
    transport_budget_total: float,
    llm_provider: str = "gemini"
) -> Optional[Dict[str, Any]]:
    """
    Executes the Transport and Stay Agent using the selected LLM provider.
    Calculates nightly lodging budget constraints and queries the LLM.
    """
    nightly_rate = round(accommodation_budget_total / max(1, duration), 2)
    
    user_prompt = TRANSPORT_STAY_USER_PROMPT.format(
        destination=destination,
        budget_tier=budget_tier,
        duration=duration,
        stay_budget_total=accommodation_budget_total,
        stay_budget_nightly=nightly_rate,
        transport_budget_total=transport_budget_total
    )
    
    # Run agent based on the provider
    if llm_provider == "openai":
        from backend.services.openai import call_openai_json
        return call_openai_json(
            api_key=api_key,
            system_prompt=TRANSPORT_STAY_SYSTEM_PROMPT,
            user_prompt=user_prompt
        )
    else:
        from backend.services.gemini import call_gemini_json
        return call_gemini_json(
            api_key=api_key,
            system_prompt=TRANSPORT_STAY_SYSTEM_PROMPT,
            user_prompt=user_prompt
        )
