# User Login

Verify that registered users can log in with valid credentials.

## Preconditions

- User account exists and is active
- User is not currently logged in

## Steps

1. Navigate to the login page -> Login form is displayed with username and password fields
2. Enter a valid username -> Username field accepts input
3. Enter the correct password -> Password field masks input
4. Click the "Sign In" button -> User is redirected to the dashboard

## Tags

smoke, authentication, login

## Priority

High

# Password Reset

Verify that users can reset their password via email.

## Preconditions

- User account exists with a verified email address

## Steps

1. Navigate to the login page
2. Click the "Forgot Password" link -> Password reset form is displayed
3. Enter the registered email address -> Confirmation message shown
4. Open the reset link from the email -> New password form loads
5. Enter and confirm a new password -> Password updated successfully
6. Log in with the new password -> User is redirected to the dashboard

## Tags

security, authentication, password

## Priority

Medium

# User Registration

Verify that new users can create an account.

## Steps

1. Navigate to the registration page -> Registration form is displayed
2. Fill in name, email, and password fields -> Fields accept input
3. Accept terms and conditions -> Checkbox is checked
4. Click "Create Account" -> Account is created and welcome email sent
5. Verify email via link -> Account is activated

## Expected Results

1. Registration form has all required fields
2. Validation messages appear for invalid input
3. Terms link opens in a new tab
4. Success message is displayed after submission
5. User can log in after verification

## Tags

smoke, registration

# Account Lockout

Verify that accounts are locked after repeated failed login attempts.

## Preconditions

- User account exists and is active
- Account lockout is configured for 5 attempts

## Steps

1. Navigate to the login page
2. Enter valid username with incorrect password 5 times -> Warning message appears after each attempt
3. Attempt login with the correct password -> Access denied with lockout message
4. Wait for the lockout period to expire -> Account unlocks automatically
5. Log in with correct credentials -> User is redirected to the dashboard

## Tags

security, lockout, negative-testing

## Priority

High

## Notes

This test may need the lockout timer adjusted in test configuration to avoid long waits.

# Search Functionality

Verify that the search feature returns relevant results.

## Steps

1. Log in and navigate to the main page -> Dashboard is displayed
2. Click the search bar -> Search input is focused
3. Type a partial product name -> Autocomplete suggestions appear
4. Select a suggestion -> Search results page loads with matching items
5. Clear the search and enter a misspelled term -> "Did you mean..." suggestion is shown

## Tags

search, usability

# Session Timeout

Verify that inactive sessions expire correctly.

## Preconditions

- Session timeout is configured to 15 minutes
- User is logged in

## Steps

1. Log in to the application -> Dashboard is displayed
2. Leave the session idle for 15 minutes -> No activity
3. Attempt to navigate to a new page -> Session expired message is displayed
4. Click "Sign In Again" -> Login page loads
5. Log in with valid credentials -> Previous page context is restored

## Tags

security, session

## Priority

Medium
