type PlaceholderPageProps = {
  title: string;
};

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="placeholder-page">
      <div>
        <p>EasyFisk</p>
        <h2>{title}</h2>
        <span>Denne siden bygger vi videre på senere.</span>
      </div>
    </section>
  );
}
