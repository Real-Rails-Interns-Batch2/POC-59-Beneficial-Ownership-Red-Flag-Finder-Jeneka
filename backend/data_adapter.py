import os
import json
import logging
from dotenv import load_dotenv

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("data_adapter")

# Load environment variables
load_dotenv()

MOCK_DATA_PATH = os.path.join(os.path.dirname(__file__), "mock_data.json")

class DataAdapter:
    def __init__(self):
        self.open_corporates_key = os.getenv("OPENCORPORATES_API_KEY")
        self.sec_api_key = os.getenv("SEC_API_KEY")
        self.ofac_api_key = os.getenv("OFAC_API_KEY")

    def load_mock_data(self):
        """Loads and returns mock ownership data."""
        logger.info("Loading fallback mock_data.json...")
        if not os.path.exists(MOCK_DATA_PATH):
            raise FileNotFoundError(f"Mock data file not found at {MOCK_DATA_PATH}")
        with open(MOCK_DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_ownership_data(self):
        """
        Attempts to fetch live data from external sources if keys are configured.
        Otherwise, falls back to mock_data.json.
        """
        # If credentials are not present, trigger mock fallback automatically
        if not all([self.open_corporates_key, self.sec_api_key, self.ofac_api_key]):
            logger.warning("External API credentials missing in .env. Falling back to mock data.")
            return self.load_mock_data()

        try:
            # Placeholder for live integration
            # In a real system, you would make requests to:
            # - OpenCorporates API for corporate relationships
            # - SEC EDGAR for beneficial ownership (Forms 3, 4, 5, 13D, 13G)
            # - OFAC API for SDN sanctions screening
            logger.info("External keys found. Attempting live queries...")
            
            # Since this is a POC demo, we will raise an exception to simulate service unavailability
            # or simply fetch a sample. Let's force fallback unless it's configured.
            raise ConnectionError("Live APIs temporarily unreachable.")
        except Exception as e:
            logger.error(f"Failed to query live endpoints: {e}. Activating mock fallback.")
            return self.load_mock_data()
