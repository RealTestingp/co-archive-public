using ProfanityFilter;

namespace COArchive.API.Services
{
    public class ContentModerationService
    {
        private readonly ProfanityFilter.ProfanityFilter _filter;

        public ContentModerationService()
        {
            _filter = new ProfanityFilter.ProfanityFilter();
        }

        public bool IsSafe(string? content)
        {
            if (string.IsNullOrWhiteSpace(content)) return true;
            var found = _filter.DetectAllProfanities(content);
            return found.Count == 0;
        }
    }
}