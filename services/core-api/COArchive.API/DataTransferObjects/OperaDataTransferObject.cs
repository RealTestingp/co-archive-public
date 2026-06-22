namespace COArchive.API.DataTransferObjects
{
    public class CreateOperaDto
    {
        public string Title { get; set; } = string.Empty;
        public List<int> ComposerIds { get; set; } = new List<int>();
        public List<int> LibrettistIds { get; set; } = new List<int>();
    }

    public class UpdateOperaDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<int> ComposerIds { get; set; } = new List<int>();
        public List<int> LibrettistIds { get; set; } = new List<int>();
    }
}