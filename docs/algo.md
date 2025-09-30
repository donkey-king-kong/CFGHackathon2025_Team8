## Matching Algo

Account Metadata

- `industry_sector`: set of strings, with predefined values to select from, but user can also add custom values
  - i.e. IT, Software, Mechanical Engineering, etc.
- `skills`: set of strings, with predefined values to select from, but user can also add custom values
- `educational background`: list of tuple: (educational level, institution)
- `hobbies`: set of strings, with predefined values to select from, but user can also add custom values

## Algo Policy

1. We will try to match by mentors to mentees in this order:

   1. industry_sector
   2. skills
   3. educational background
   4. hobbies

2. We generate a percentage match for each mentor-mentee pairs:
