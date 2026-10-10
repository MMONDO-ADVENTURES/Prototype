import { Link } from "react-router-dom";
import { Icon } from "../utils";

export default function Messages() {
  return (
    <div className="bg-white min-h-[70vh] font-body-md text-charcoal">
      <div className="max-w-[720px] mx-auto px-margin-mobile lg:px-margin-desktop py-12 md:py-16">
        <h1 className="font-headline-sm text-[28px] text-charcoal mb-2">Messages</h1>
        <p className="text-[15px] text-slate-gray mb-8">Updates from your operator and Mmondo Adventures appear here.</p>
        <div className="rounded-2xl border border-surface-container bg-surface-container-low px-6 py-12 text-center">
          <Icon name="mail" className="text-[36px] text-primary mb-3" />
          <p className="font-semibold text-[16px] text-charcoal mb-1">No messages yet</p>
          <p className="text-[14px] text-slate-gray mb-5">When an operator or our team writes to you, it will show up here.</p>
          <Link className="inline-flex items-center gap-2 text-primary hover:text-primary-container font-label-md text-[14px]" to="/contact">
            Contact support
            <Icon name="arrow_forward" className="text-[16px]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
