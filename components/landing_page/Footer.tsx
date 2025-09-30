export default function Footer() {
  return (
    <footer className="bg-[#3C14A6] text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-4">United Women Singapore</h3>
            <p className="text-sm text-white/80">
              Empowering women and girls through education, raising awareness, and advocacy for gender equality.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <p className="text-sm text-white/80">
              Email: contact@uws.org.sg<br />
              Phone: +65 1234 5678<br />
              Address: Singapore
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/10 text-sm text-white/60 flex justify-between items-center">
          <span>© {new Date().getFullYear()} United Women Singapore. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
