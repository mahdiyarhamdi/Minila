"""Unit tests for email templates."""

import pytest
from app.utils.email_templates import get_template, TEMPLATES


class TestGetTemplate:
    """Tests for get_template function."""
    
    def test_always_returns_english_regardless_of_language_param(self):
        """Test that get_template always returns English template."""
        # Test with different language parameters
        subject_fa, body_fa = get_template("otp", "fa", otp_code="123456")
        subject_en, body_en = get_template("otp", "en", otp_code="123456")
        subject_ar, body_ar = get_template("otp", "ar", otp_code="123456")
        
        # All should return the same English template
        assert subject_fa == subject_en == subject_ar
        assert "Your Minila Login Code" in subject_fa
        assert "123456" in body_fa
    
    def test_otp_template(self):
        """Test OTP template."""
        subject, body = get_template("otp", "en", otp_code="654321")
        
        assert "Login Code" in subject
        assert "654321" in body
        assert "Minila" in body
    
    def test_welcome_template(self):
        """Test welcome template."""
        subject, body = get_template("welcome", "en", first_name="John")
        
        assert "Welcome" in subject
        assert "John" in body
    
    def test_new_message_template(self):
        """Test new message notification template."""
        subject, body = get_template(
            "new_message", 
            "en", 
            sender_name="Alice",
            app_url="https://minila.app"
        )
        
        assert "New Message" in subject
        assert "Alice" in body
        assert "https://minila.app" in body
    
    def test_membership_request_template(self):
        """Test membership request template."""
        subject, body = get_template(
            "membership_request",
            "en",
            user_name="Bob",
            community_name="Tech Community"
        )
        
        assert "New membership request" in subject
        assert "Bob" in body
        assert "Tech Community" in body
    
    def test_membership_approved_template(self):
        """Test membership approved template."""
        subject, body = get_template(
            "membership_approved",
            "en",
            community_name="Travel Club"
        )
        
        assert "approved" in subject.lower()
        assert "Travel Club" in body
    
    def test_membership_rejected_template(self):
        """Test membership rejected template."""
        subject, body = get_template(
            "membership_rejected",
            "en",
            community_name="Private Group"
        )
        
        assert "Private Group" in body
    
    def test_role_change_template(self):
        """Test role change notification template."""
        subject, body = get_template(
            "role_change",
            "en",
            community_name="Dev Team",
            new_role="Manager"
        )
        
        assert "role" in subject.lower()
        assert "Dev Team" in body
        assert "Manager" in body
    
    def test_unread_summary_template(self):
        """Test unread summary template."""
        subject, body = get_template(
            "unread_summary",
            "en",
            count=5,
            app_url="https://minila.app"
        )
        
        assert "5" in body
        assert "unread" in body.lower()
    
    def test_invalid_template_returns_fallback(self):
        """Test that invalid template name returns fallback."""
        subject, body = get_template("nonexistent_template", "en")
        
        # Should return template name as subject
        assert subject == "nonexistent_template"
    
    def test_all_templates_exist_in_english(self):
        """Test that all templates have English version."""
        for template_name in TEMPLATES.keys():
            assert "en" in TEMPLATES[template_name], f"Template {template_name} missing English version"


class TestTemplatesStructure:
    """Tests for TEMPLATES structure."""
    
    def test_templates_have_required_keys(self):
        """Test that each template has subject and body."""
        for template_name, languages in TEMPLATES.items():
            for lang, content in languages.items():
                assert "subject" in content, f"{template_name}[{lang}] missing 'subject'"
                assert "body" in content, f"{template_name}[{lang}] missing 'body'"
    
    def test_english_templates_are_english(self):
        """Test that English templates don't contain non-ASCII characters heavily."""
        for template_name, languages in TEMPLATES.items():
            if "en" in languages:
                subject = languages["en"]["subject"]
                body = languages["en"]["body"]
                
                # English should not have Persian/Arabic characters
                persian_chars = any('\u0600' <= c <= '\u06FF' for c in subject)
                assert not persian_chars, f"{template_name}[en] subject contains Persian/Arabic"


