# Privacy Policy — template placeholder

Ona World Kernel is a game **template**. It ships without a privacy policy,
because the policy belongs to the game you build with it — your data
practices, your jurisdiction, your company.

What the kernel itself does with data, for reference when writing yours:

- Accounts: username + salted-scrypt password hash, optional email.
- Characters and progress persisted in Postgres between sessions.
- Chat/social activity relayed to other players and retained for moderation.
- Technical/log data (IP, user agent) used for rate limiting and abuse
  prevention.
- Cookies/local storage for sessions and preferences.
- **No third-party analytics or marketing trackers** — the template ships
  with none.

Before shipping: write your own policy and replace this file and the served
page at `public/privacy.html`.
