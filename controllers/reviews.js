const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const { userIsAdmin } = require("../middleware.js");


module.exports.postReview=async(req,res)=>{
let listing=await Listing.findById(req.params.id);
if(!listing){
    req.flash("error","Listing not found");
    return res.redirect("/listings");
}
let newReview=new Review(req.body.review);
newReview.author=req.user._id;
listing.reviews.push(newReview);
await newReview.save();
await listing.save();
res.redirect(`/listings/${listing.id}`);
};

module.exports.deleteReview=async (req, res) => {
        let { id, reviewId } = req.params;

        const review = await Review.findById(reviewId);

        if(!review){
            req.flash("error","Review not found");
            return res.redirect(`/listings/${id}`);
        }

        // Only the author of the review (or an admin) can delete it
        if(!(review.author && review.author.equals(req.user._id)) && !userIsAdmin(req.user)){
            req.flash("error","You can only delete your own review");
            return res.redirect(`/listings/${id}`);
        }

        await Listing.findByIdAndUpdate(id, {
            $pull: { reviews: reviewId }
        });

        await Review.findByIdAndDelete(reviewId);

        res.redirect(`/listings/${id}`);
    };
