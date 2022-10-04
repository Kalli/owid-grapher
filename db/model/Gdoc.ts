import { Entity, PrimaryColumn, Column, BaseEntity } from "typeorm"
import { OwidArticleContent } from "../../clientUtils/owidTypes.js"
import {
    GDOCS_CLIENT_EMAIL,
    GDOCS_CLIENT_ID,
    GDOCS_PRIVATE_KEY,
} from "../../settings/serverSettings.js"
import { google, Auth } from "googleapis"
import { gdocToArchieML } from "../gdocToArchieml.js"

@Entity("posts_gdocs")
export class Gdoc extends BaseEntity {
    @PrimaryColumn() id!: string
    @Column() slug: string = ""
    @Column({ default: "{}", type: "json" }) content!: OwidArticleContent
    @Column() published: boolean = false
    @Column() createdAt: Date = new Date()
    @Column({ type: Date, nullable: true }) publishedAt: Date | null = null
    @Column({ type: Date, nullable: true }) updatedAt: Date | null = null

    constructor(id: string) {
        super()
        this.id = id
    }
    static cachedGoogleAuth?: Auth.GoogleAuth

    static getGoogleAuth(): Auth.GoogleAuth {
        if (!Gdoc.cachedGoogleAuth) {
            Gdoc.cachedGoogleAuth = new google.auth.GoogleAuth({
                credentials: {
                    type: "service_account",
                    private_key: GDOCS_PRIVATE_KEY.split("\\n").join("\n"),
                    client_email: GDOCS_CLIENT_EMAIL,
                    client_id: GDOCS_CLIENT_ID,
                },
                // Scopes can be specified either as an array or as a single, space-delimited string.
                scopes: ["https://www.googleapis.com/auth/documents.readonly"],
            })
        }
        return Gdoc.cachedGoogleAuth
    }

    async updateWithDraft(): Promise<void> {
        const auth = Gdoc.getGoogleAuth()

        const draftContent = await gdocToArchieML({
            documentId: this.id,
            auth,
        })
        this.content = draftContent
    }
}
