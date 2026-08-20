function hideSidebar(){
  const sidebar = document.querySelector('#sidebar')
  const penutup = document.querySelector('#penutup')

  sidebar.classList.remove('open')
  penutup.classList.remove('active')
  document.body.classList.remove('no-scroll')
  document.body.classList.remove('sidebar-open')
}

function showSidebar(){
  const sidebar = document.querySelector('#sidebar')
  const penutup = document.querySelector('#penutup')

  sidebar.classList.add('open')
  penutup.classList.add('active')
  document.body.classList.add('no-scroll')
  document.body.classList.add('sidebar-open')
}

const overlay = document.querySelector('#penutup')
if (overlay) {
  overlay.addEventListener('click', hideSidebar)
}

// Scroll to top functionality
const scrollTopBtn = document.querySelector('#scrollToTopBtn');
if (scrollTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('show');
    } else {
      scrollTopBtn.classList.remove('show');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}
