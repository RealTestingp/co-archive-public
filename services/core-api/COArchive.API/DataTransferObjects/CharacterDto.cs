namespace COArchive.API.DataTransferObjects
{
    public class CreateCharacterDto
    {
        public string Name { get; set; } = string.Empty;
        public int OperaId { get; set; }
    }

    public class UpdateCharacterDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int OperaId { get; set; }
    }
}