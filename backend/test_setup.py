"""
Quick test script to verify setup is working.
Run this after completing setup to verify everything is configured correctly.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_env_vars():
    """Test that all required environment variables are set."""
    print("🔍 Checking environment variables...")
    
    required_vars = [
        "DATABASE_URL",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_KEY",
        "OPENAI_API_KEY",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
    ]
    
    missing = []
    for var in required_vars:
        value = os.getenv(var)
        if not value or value.startswith("xxx") or value.startswith("your-"):
            missing.append(var)
            print(f"  ❌ {var}: Not set or using placeholder")
        else:
            # Show first 10 chars for security
            preview = value[:10] + "..." if len(value) > 10 else value
            print(f"  ✅ {var}: {preview}")
    
    if missing:
        print(f"\n❌ Missing or invalid environment variables: {', '.join(missing)}")
        print("Please update your .env file with real values.")
        return False
    
    print("\n✅ All environment variables are set!")
    return True


def test_database_connection():
    """Test database connection."""
    print("\n🔍 Testing database connection...")
    
    try:
        from database.client import test_connection
        
        if test_connection():
            print("✅ Database connection successful!")
            return True
        else:
            print("❌ Database connection failed!")
            return False
            
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False


def test_supabase_client():
    """Test Supabase client."""
    print("\n🔍 Testing Supabase client...")
    
    try:
        from database.client import get_supabase_client
        
        supabase = get_supabase_client()
        
        # Try to query users table
        result = supabase.table("users").select("id").limit(1).execute()
        
        print("✅ Supabase client working!")
        return True
        
    except Exception as e:
        print(f"❌ Supabase client error: {e}")
        print("Make sure you've run the database migrations in Supabase.")
        return False


def test_openai_api():
    """Test OpenAI API."""
    print("\n🔍 Testing OpenAI API...")
    
    try:
        from services.embedding_service import EmbeddingService
        
        service = EmbeddingService()
        embedding = service.generate_embedding("test")
        
        if len(embedding) == 1536:
            print("✅ OpenAI API working!")
            return True
        else:
            print(f"❌ Unexpected embedding size: {len(embedding)}")
            return False
            
    except Exception as e:
        print(f"❌ OpenAI API error: {e}")
        print("Check your OPENAI_API_KEY and make sure you have credits.")
        return False


def test_google_oauth_config():
    """Test Google OAuth configuration."""
    print("\n🔍 Testing Google OAuth configuration...")
    
    try:
        from config import settings
        
        if not settings.GOOGLE_CLIENT_ID or settings.GOOGLE_CLIENT_ID.startswith("your-"):
            print("❌ GOOGLE_CLIENT_ID not configured")
            return False
        
        if not settings.GOOGLE_CLIENT_SECRET or settings.GOOGLE_CLIENT_SECRET.startswith("your-"):
            print("❌ GOOGLE_CLIENT_SECRET not configured")
            return False
        
        print("✅ Google OAuth configuration looks good!")
        print(f"   Client ID: {settings.GOOGLE_CLIENT_ID[:20]}...")
        print(f"   Redirect URI: {settings.GOOGLE_REDIRECT_URI}")
        return True
        
    except Exception as e:
        print(f"❌ Google OAuth config error: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("COSOS Setup Verification")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Environment Variables", test_env_vars()))
    results.append(("Database Connection", test_database_connection()))
    results.append(("Supabase Client", test_supabase_client()))
    results.append(("OpenAI API", test_openai_api()))
    results.append(("Google OAuth Config", test_google_oauth_config()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        print("\n🎉 All tests passed! You're ready to start the backend.")
        print("\nNext steps:")
        print("1. Run: uvicorn main:app --reload")
        print("2. Open: http://localhost:8000/docs")
        print("3. Test OAuth flow with your Google account")
        return 0
    else:
        print("\n❌ Some tests failed. Please fix the issues above.")
        print("\nSee docs/SETUP_GUIDE.md for detailed setup instructions.")
        return 1


if __name__ == "__main__":
    sys.exit(main())

