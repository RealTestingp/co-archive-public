namespace COArchive.Models
{
    // Marker interface. Add this to Person, Production, Character, Opera, Appearance
    // (and any future entity) to have EF Core audit its changes automatically.
    public interface IAuditable
    {
    }
}